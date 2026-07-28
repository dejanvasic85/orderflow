import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "react-email";
import { company } from "@/lib/config";

type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
};

const styles = {
  body: { backgroundColor: "#f1eeea", fontFamily: "sans-serif", margin: 0, padding: 0 },
  container: { backgroundColor: "#ffffff", borderRadius: "8px", margin: "32px auto", padding: "0" },
  header: { backgroundColor: "#7f1f2c", borderRadius: "8px 8px 0 0", padding: "24px 32px" },
  headerText: { color: "#fdf9f6", fontSize: "20px", fontWeight: "700", margin: 0 },
  content: { padding: "32px" },
  footer: { backgroundColor: "#f1eeea", borderRadius: "0 0 8px 8px", padding: "16px 32px" },
  footerText: { color: "#9a938d", fontSize: "12px", margin: 0 },
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
