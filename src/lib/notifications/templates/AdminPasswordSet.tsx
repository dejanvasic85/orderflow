import { Heading, Text } from "react-email";
import { render } from "react-email";
import { company } from "@/lib/config";
import { EmailLayout } from "./EmailLayout";

type Props = {
  email: string;
  adminName: string;
};

function AdminPasswordSet({ email, adminName }: Props) {
  return (
    <EmailLayout preview={`Your ${company.name} password was set by an administrator`}>
      <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 16px" }}>
        Your password was reset by an administrator
      </Heading>
      <Text style={{ margin: "0 0 16px" }}>
        The password for your account ({email}) was set by {adminName}.
      </Text>
      <Text style={{ margin: "0 0 16px" }}>
        You will be required to choose a new password the next time you sign in.
      </Text>
      <Text style={{ margin: "0 0 16px", fontWeight: "700" }}>
        If you did not expect this change, contact {company.name} immediately.
      </Text>
    </EmailLayout>
  );
}

export async function renderAdminPasswordSet(input: Props) {
  return {
    subject: `Your ${company.name} password was reset by an administrator`,
    html: await render(<AdminPasswordSet {...input} />),
  };
}
