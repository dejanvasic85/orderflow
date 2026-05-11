import { useState } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { MockUser } from "./mockData";
import { mockAccounts } from "./mockData";

type Props = {
  user: MockUser;
  onSave: (updated: MockUser) => void;
  onDiscard: () => void;
};

export function UserEditPanel({ user, onSave, onDiscard }: Props) {
  const [firstName, setFirstName] = useState(() => user.name.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(() => user.name.split(" ").slice(1).join(" "));
  const [role, setRole] = useState<MockUser["role"]>(user.role);
  const [accounts, setAccounts] = useState(user.accounts);
  const [notifEmail, setNotifEmail] = useState(user.notification_preferences.email);
  const [notifSms, setNotifSms] = useState(user.notification_preferences.sms);

  const unassignedAccounts = mockAccounts.filter((a) => !accounts.some((ua) => ua.id === a.id));

  function handleRemoveAccount(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  function handleAddAccount(id: string) {
    const account = mockAccounts.find((a) => a.id === id);
    if (account) {
      setAccounts((prev) => [...prev, account]);
    }
  }

  function handleSave() {
    onSave({
      ...user,
      name: [firstName, lastName].filter(Boolean).join(" "),
      role,
      accounts,
      notification_preferences: { email: notifEmail, sms: notifSms },
    });
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-base font-semibold">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Separator />

      {/* Basic fields */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="first-name">First name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last-name">Last name</Label>
            <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user.email} disabled />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as MockUser["role"])}>
            <SelectTrigger id="role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Assigned accounts */}
      <div className="flex flex-col gap-3">
        <Label>Assigned accounts</Label>

        {accounts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {accounts.map((account) => (
              <Badge key={account.id} variant="secondary" className="gap-1.5 py-1 pl-2.5 pr-1.5">
                {account.name}
                <button
                  type="button"
                  aria-label={`Remove ${account.name}`}
                  onClick={() => handleRemoveAccount(account.id)}
                  className="flex items-center justify-center rounded-full transition-colors hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {unassignedAccounts.length > 0 && (
          <Select onValueChange={handleAddAccount}>
            <SelectTrigger className="w-full text-muted-foreground">
              <SelectValue placeholder="Add an account..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {unassignedAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      {/* Notification preferences */}
      <div className="flex flex-col gap-3">
        <Label>Notification preferences</Label>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="notif-email-order"
                checked={notifEmail}
                onCheckedChange={(v) => setNotifEmail(!!v)}
              />
              <Label htmlFor="notif-email-order" className="font-normal">
                Order placement
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="notif-email-status"
                checked={notifEmail}
                onCheckedChange={(v) => setNotifEmail(!!v)}
              />
              <Label htmlFor="notif-email-status" className="font-normal">
                Order status changes
              </Label>
            </div>
          </div>

          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SMS</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="notif-sms-order"
                checked={notifSms}
                onCheckedChange={(v) => setNotifSms(!!v)}
              />
              <Label htmlFor="notif-sms-order" className="font-normal">
                Order placement
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="notif-sms-status"
                checked={notifSms}
                onCheckedChange={(v) => setNotifSms(!!v)}
              />
              <Label htmlFor="notif-sms-status" className="font-normal">
                Order status changes
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave}>Save changes</Button>
        <Button variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  );
}
