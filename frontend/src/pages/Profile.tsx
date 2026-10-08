import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "../components/Closing";
import { GoogleButton } from "../components/GoogleButton";
import { PhotoPicker } from "../components/PhotoPicker";
import { Switch } from "../components/Switch";
import { StepDepartment } from "../components/register/StepDepartment";
import { StepInterests } from "../components/register/StepInterests";
import { api } from "../lib/api";
import type { Me } from "../lib/api";
import type { Department, InterestId } from "../lib/data";
import { useMe, useRefresh } from "../lib/queries";
import { useSession } from "../lib/session";

function Section({ title, hint, children, testId }: { title: string; hint: string; children: React.ReactNode; testId: string }) {
  return (
    <section className="grid gap-5 border-t border-white/10 py-10 md:grid-cols-12" data-testid={testId}>
      <div className="md:col-span-4">
        <h2 className="font-display text-xl font-bold uppercase text-white">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{hint}</p>
      </div>
      <div className="md:col-span-8">{children}</div>
    </section>
  );
}

function ProfileForm({ me, token }: { me: Me; token: string }) {
  const { addProfile } = useSession();
  const refresh = useRefresh();
  const [name, setName] = useState(me.name);
  const [picture, setPicture] = useState(me.picture);
  const [bio, setBio] = useState(me.bio);
  const [interests, setInterests] = useState<InterestId[]>(me.interests);
  const [department, setDepartment] = useState<Department | null>(me.department);
  const [consent, setConsent] = useState(me.accepts_location_requests);
  const [busy, setBusy] = useState(false);

  const dirty =
    name.trim() !== me.name || picture !== me.picture || bio.trim() !== me.bio || consent !== me.accepts_location_requests || department !== me.department ||
    interests.length !== me.interests.length || interests.some((i) => !me.interests.includes(i));

  const save = async () => {
    if (interests.length === 0) {
      toast.error("Pick at least one interest");
      return;
    }
    if (!department) return;
    setBusy(true);
    try {
      const updated = await api.updateMe(token, { name: name.trim(), picture, bio: bio.trim(), interests, department, accepts_location_requests: consent });
      addProfile({ id: updated.id, name: updated.name, token, picture: updated.picture });
      refresh();
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save changes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="profile-form">
      <Section title="Photo & name" hint="How you show up in the directory, requests and chats." testId="profile-section-identity">
        <div className="grid gap-6">
          <PhotoPicker name={name || me.name} seed={me.id} value={picture} onChange={setPicture} />
          <label className="grid gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              data-testid="profile-name-input"
              className="h-14 rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-white placeholder:text-zinc-500 focus:border-[#ffb086] focus:outline-none"
            />
          </label>
          <label className="grid gap-2">
            <span className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              About you <span className="text-zinc-500">{bio.length}/160</span>
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              rows={2}
              placeholder="One line about you — what you're into, what you're looking for."
              data-testid="profile-bio-input"
              className="resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-white placeholder:text-zinc-500 focus:border-[#ffb086] focus:outline-none"
            />
          </label>
          <p className="flex items-center gap-2 text-sm text-zinc-400" data-testid="profile-phone">
            <Phone className="h-4 w-4" /> {me.phone} <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">verified · can't be changed here</span>
          </p>
        </div>
      </Section>

      <Section title="Interests" hint="Pick everything you'd actually show up for. Trending scenes are tagged." testId="profile-section-interests">
        <StepInterests value={interests} onChange={setInterests} />
      </Section>

      <Section title="Department" hint="Where people will find you when they filter the directory." testId="profile-section-department">
        <StepDepartment value={department} onChange={setDepartment} />
      </Section>

      <Section title="Location requests" hint="Turn this off and nobody can send you a new request. Existing shares aren't affected." testId="profile-section-consent">
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5">
          <span className="text-sm text-zinc-200">Accept location requests</span>
          <Switch checked={consent} onChange={setConsent} label="Accept location requests" testId="profile-consent-switch" />
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#15111d]/90 p-4 backdrop-blur-xl">
        <p className="text-sm text-zinc-400" data-testid="profile-dirty-hint">{dirty ? "You have unsaved changes." : "Everything is saved."}</p>
        <button onClick={save} disabled={busy || !dirty} data-testid="profile-save-btn" className="inline-flex items-center gap-2 rounded-full bg-[#ffb086] px-7 py-3 font-semibold text-[#0c0a12] transition-transform hover:scale-[1.03] disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save changes
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { active } = useSession();
  const me = useMe();

  if (!active) {
    return (
      <main className="grid min-h-screen place-items-center px-5 pt-28" data-testid="profile-page">
        <div className="max-w-md text-center">
          <Lock className="mx-auto h-10 w-10 text-[#ffb086]" />
          <h1 className="mt-6 font-display text-3xl font-bold uppercase text-white">Your profile</h1>
          <p className="mt-3 text-zinc-300">Register or sign in to edit your name, photo, interests and department.</p>
          <Link to="/register" data-testid="profile-register-link" className="mt-8 inline-flex rounded-full bg-[#ffb086] px-7 py-4 font-semibold text-[#0c0a12]">Start registration</Link>
          <div className="mt-4 flex justify-center"><GoogleButton testId="profile-page-google-signin-btn" /></div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen pt-28 md:pt-36" data-testid="profile-page">
      <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <p className="eyebrow mb-4">Your profile</p>
        <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] text-white sm:text-5xl lg:text-6xl">Edit how you show up.</h1>
        <p className="mt-4 max-w-xl text-zinc-300">Changes apply instantly across the directory, requests and messages.</p>
        <div className="mt-10">
          {me.isLoading && <p className="flex items-center gap-2 text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…</p>}
          {me.error && <p className="text-rose-300" data-testid="profile-error">{me.error.message}</p>}
          {me.data && <ProfileForm key={me.data.id} me={me.data} token={active.token} />}
        </div>
      </div>
      <Footer />
    </main>
  );
}
