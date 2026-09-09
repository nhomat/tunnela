"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading, TableSkeleton } from "@/components/table-skeleton";
import { listTeamMembers, listTeamMessages } from "@/lib/team";
import type { TeamMember, TeamMessage } from "@/lib/team";
import { COOP_ADDON_PRIX_PAR_PERSONNE } from "@/lib/stripe";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";

const SPINNER_CYCLE_MS = 900;
const SKELETON_CYCLE_MS = 1400;

export default function EquipePage() {
  const { ownPlan, team, loading } = useCurrentPlan();
  const showLoading = useHoldLoadingAnimation(loading, SPINNER_CYCLE_MS);

  if (showLoading) return <PageLoading />;

  if (team?.coopAccess) return <Equipe />;

  if (ownPlan === "decouverte") {
    return <CoopUpgradeNeeded />;
  }

  return <CoopAddonPromo />;
}

function CoopUpgradeNeeded() {
  const { t } = useApp();
  return (
    <div className="card card-hover tunnel-enter max-w-lg text-center">
      <p className="font-serif text-lg">{t.equipe.needsPlanTitle}</p>
      <p className="mt-2 text-sm text-[var(--foreground)]/70">{t.equipe.needsPlanBody}</p>
      <Link href="/dashboard/abonnement" className="btn-primary transition-base mt-4 inline-flex text-sm">
        {t.baux.upgrade}
      </Link>
    </div>
  );
}

function CoopAddonPromo() {
  const { t } = useApp();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubscribe() {
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/stripe/addon/coop", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "subscribe" }),
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div className="card card-hover tunnel-enter max-w-lg text-center">
      <p className="font-serif text-lg">{t.equipe.addonTitle}</p>
      <p className="mt-2 text-sm text-[var(--foreground)]/70">{t.equipe.addonSubtitle}</p>
      <p className="mt-4 font-serif text-3xl">
        +{COOP_ADDON_PRIX_PAR_PERSONNE} €
        <span className="text-sm text-[var(--foreground)]/60"> {t.pricing.perMonthPerPerson}</span>
      </p>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={pending}
        className="btn-primary transition-base mt-4 disabled:opacity-60"
      >
        {t.equipe.addonSubscribe}
      </button>
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{t.equipe.addonError}</p>}
    </div>
  );
}

function Equipe() {
  const { t } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const { team } = useCurrentPlan();

  const [equipeId, setEquipeId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "sending" | "error" | "duplicate">("idle");
  const [creating, setCreating] = useState(false);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.equipeId]);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setMyUserId(user.id);

    if (team?.isOwner) {
      const { data: equipe } = await supabase
        .from("equipes")
        .select("id, nom")
        .eq("proprietaire_user_id", user.id)
        .maybeSingle();
      setIsOwner(true);
      setOwnerEmail(user.email ?? null);
      setOwnerId(user.id);
      if (equipe) {
        setEquipeId(equipe.id);
        setMembers(await listTeamMembers(supabase, equipe.id));
      }
    } else if (team?.equipeId) {
      setEquipeId(team.equipeId);
      setIsOwner(false);
      setMembers(await listTeamMembers(supabase, team.equipeId));
      const { data: equipe } = await supabase
        .from("equipes")
        .select("proprietaire_user_id")
        .eq("id", team.equipeId)
        .maybeSingle();
      setOwnerId(equipe?.proprietaire_user_id ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!equipeId) return;

    void listTeamMessages(supabase, equipeId).then(setMessages);

    const channel = supabase
      .channel(`messages_equipe_${equipeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages_equipe", filter: `equipe_id=eq.${equipeId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TeamMessage]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [equipeId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const senderNames = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => {
      if (m.user_id) map.set(m.user_id, m.email);
    });
    return map;
  }, [members]);

  function senderLabel(userId: string): string {
    if (userId === ownerId) return ownerEmail ?? t.equipe.roleOwner;
    return senderNames.get(userId) ?? t.equipe.roleMember;
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !equipeId || !myUserId) return;
    setSendingMessage(true);
    await supabase
      .from("messages_equipe")
      .insert({ equipe_id: equipeId, user_id: myUserId, contenu: newMessage.trim() });
    setNewMessage("");
    setSendingMessage(false);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("equipes").insert({ proprietaire_user_id: user.id, nom: nom.trim() });
      await load();
    }
    setCreating(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteStatus("sending");
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.status === 409) {
        setInviteStatus("duplicate");
        return;
      }
      if (!res.ok) throw new Error();
      setInviteEmail("");
      setInviteStatus("idle");
      await load();
    } catch {
      setInviteStatus("error");
    }
  }

  async function handleRemove(memberId: string) {
    if (!window.confirm(t.equipe.removeConfirm)) return;
    await fetch("/api/team/remove", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    await load();
  }

  async function handleUnsubscribeAddon() {
    if (!window.confirm(t.equipe.addonUnsubscribeConfirm)) return;
    setUnsubscribing(true);
    try {
      const res = await fetch("/api/stripe/addon/coop", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe" }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setUnsubscribing(false);
    }
  }

  const showLoading = useHoldLoadingAnimation(loading, SKELETON_CYCLE_MS);
  if (showLoading) return <TableSkeleton rows={3} />;

  return (
    <div className="tunnel-enter">
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="7" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="14" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M2.5 16c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M12.5 12c1.9 0 3.5 1.8 3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.equipe.title}</h1>
      </div>
      <p className="mb-8 text-[var(--foreground)]/70">{t.equipe.subtitle}</p>

      {isOwner && !equipeId && (
        <form onSubmit={handleCreateTeam} className="card flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium">{t.equipe.teamNameLabel}</span>
            <input
              className="input transition-base"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={t.equipe.teamNamePlaceholder}
            />
          </label>
          <button type="submit" disabled={creating} className="btn-primary transition-base disabled:opacity-60">
            {t.equipe.createTeam}
          </button>
        </form>
      )}

      {equipeId && (
        <>
          {isOwner && (
            <form onSubmit={handleInvite} className="card mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm">
                <span className="mb-1 block font-medium">{t.equipe.inviteLabel}</span>
                <input
                  type="email"
                  required
                  className="input transition-base"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collegue@cabinet.fr"
                />
              </label>
              <button
                type="submit"
                disabled={inviteStatus === "sending"}
                className="btn-primary transition-base disabled:opacity-60"
              >
                {t.equipe.inviteButton}
              </button>
            </form>
          )}
          {inviteStatus === "error" && (
            <p className="mb-4 text-sm text-[var(--danger)]">{t.equipe.inviteError}</p>
          )}
          {inviteStatus === "duplicate" && (
            <p className="mb-4 text-sm text-[var(--accent)]">{t.equipe.inviteDuplicate}</p>
          )}

          {isOwner && ownerEmail && (
            <p className="mb-3 text-sm text-[var(--foreground)]/70">
              {t.equipe.roleOwner} : <span className="font-medium">{ownerEmail}</span>
            </p>
          )}
          <div data-hscroll="true" className="card overflow-x-auto p-0">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                  <th className="px-4 py-3">{t.equipe.email}</th>
                  <th className="px-4 py-3">{t.equipe.role}</th>
                  <th className="px-4 py-3">{t.equipe.statut}</th>
                  {isOwner && <th className="px-4 py-3">{t.baux.actions}</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--border-color)] last:border-0">
                    <td className="px-4 py-3">{m.email}</td>
                    <td className="px-4 py-3">
                      {m.role === "proprietaire" ? t.equipe.roleOwner : t.equipe.roleMember}
                    </td>
                    <td className="px-4 py-3">
                      {m.statut === "actif" ? t.equipe.statutActive : t.equipe.statutInvited}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        {m.role !== "proprietaire" && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m.id)}
                            className="transition-base text-[var(--danger)] hover:underline"
                          >
                            {t.baux.delete}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={isOwner ? 4 : 3} className="px-4 py-3 text-[var(--foreground)]/60">
                      {t.equipe.noMembers}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 mt-10 font-serif text-lg">{t.equipe.messagesTitle}</h2>
          <div className="card flex flex-col">
            <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-sm text-[var(--foreground)]/60">{t.equipe.noMessages}</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={m.user_id === myUserId ? "self-end text-right" : ""}>
                  <p className="text-xs text-[var(--foreground)]/50">
                    {senderLabel(m.user_id)} · {new Date(m.created_at).toLocaleString("fr-FR")}
                  </p>
                  <p className="mt-0.5 inline-block max-w-md break-words rounded-lg bg-[var(--foreground)]/[0.05] px-3 py-2 text-sm">
                    {m.contenu}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
              <input
                className="input transition-base flex-1"
                placeholder={t.equipe.messagePlaceholder}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                className="btn-primary transition-base disabled:opacity-60"
              >
                {t.equipe.sendMessage}
              </button>
            </form>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={handleUnsubscribeAddon}
              disabled={unsubscribing}
              className="transition-base mt-8 text-sm text-[var(--danger)] hover:underline disabled:opacity-60"
            >
              {t.equipe.addonUnsubscribe}
            </button>
          )}
        </>
      )}
    </div>
  );
}
