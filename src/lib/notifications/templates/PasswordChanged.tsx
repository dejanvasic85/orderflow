import { Heading, Text } from "react-email";
import { render } from "react-email";
import { company } from "@/lib/config";
import { EmailLayout } from "./EmailLayout";

type Props = {
  email: string;
};

function PasswordChanged({ email }: Props) {
  return (
    <EmailLayout preview={`Your ${company.name} password was changed`}>
      <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 16px" }}>
        Your password was changed
      </Heading>
      <Text style={{ margin: "0 0 16px" }}>
        The password for your account ({email}) was just changed.
      </Text>
      <Text style={{ margin: "0 0 16px", fontWeight: "700" }}>
        If you didn&apos;t make this change, contact {company.name} immediately.
      </Text>
    </EmailLayout>
  );
}

export async function renderPasswordChanged(input: Props) {
  return {
    subject: `Your ${company.name} password was changed`,
    html: await render(<PasswordChanged {...input} />),
  };
}
