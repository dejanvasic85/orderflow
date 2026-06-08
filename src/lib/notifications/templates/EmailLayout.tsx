import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "react-email";
import { company } from "@/lib/config";

type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
};

const styles = {
  body: { backgroundColor: "#f9fafb", fontFamily: "sans-serif", margin: 0, padding: 0 },
  container: { backgroundColor: "#ffffff", borderRadius: "8px", margin: "32px auto", padding: "0" },
  header: { backgroundColor: "#1e3a5f", borderRadius: "8px 8px 0 0", padding: "24px 32px" },
  headerText: { color: "#ffffff", fontSize: "20px", fontWeight: "700", margin: 0 },
  content: { padding: "32px" },
  footer: { backgroundColor: "#f3f4f6", borderRadius: "0 0 8px 8px", padding: "16px 32px" },
  footerText: { color: "#9ca3af", fontSize: "12px", margin: 0 },
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>{company.name}</Text>
          </Section>
          <Section style={styles.content}>{children}</Section>
          <Hr />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              You are receiving this because you are assigned to this account. Manage your
              notification preferences in {company.name}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
