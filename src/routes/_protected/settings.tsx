import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditProfileForm } from "@/components/users/EditProfileForm";
import { asResult } from "@/lib/result";
import type { UpdateOwnProfileInput } from "@/lib/users/schema";
import { getOwnProfile, updateOwnProfile } from "@/lib/users/users.functions";

type OwnProfile = {
  email: string;
  name: string;
  phone: string;
  notificationPreferences: { email: boolean; sms: boolean };
};

export const Route = createFileRoute("/_protected/settings")({
  loader: async () => {
    const result = asResult<OwnProfile>(await getOwnProfile());
    if (!result.ok) throw new Error(result.error.message);
    return { profile: result.value };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { profile } = Route.useLoaderData();
  const router = useRouter();

  async function handleSaveProfile(input: UpdateOwnProfileInput) {
    const result = asResult<void>(await updateOwnProfile({ data: input }));
    if (result.ok) {
      toast.success("Details updated");
    }
    return result;
  }

  const [firstName, ...rest] = profile.name.split(" ");
  const lastName = rest.join(" ");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your personal details and notification preferences"
        onBack={() => router.history.back()}
      />
      <PageContent className="mx-auto w-full max-w-md">
        <EditProfileForm
          defaultValues={{
            firstName: firstName ?? "",
            lastName,
            email: profile.email,
            phone: profile.phone,
            notifications: profile.notificationPreferences,
          }}
          onSave={handleSaveProfile}
        />
      </PageContent>
    </>
  );
}
