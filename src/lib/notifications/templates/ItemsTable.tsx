import { Column, Row, Section, Text } from "react-email";
import type { OrderEmailItem } from "./types";

type Props = { items: OrderEmailItem[] };

const styles = {
  header: { backgroundColor: "#f3f4f6", padding: "10px 12px" },
  headerText: { color: "#6b7280", fontSize: "13px", fontWeight: "600", margin: 0 },
  cell: { borderBottom: "1px solid #e5e7eb", padding: "8px 12px" },
  cellText: { fontSize: "14px", margin: 0 },
  cellTextCenter: { fontSize: "14px", margin: 0, textAlign: "center" as const },
};

export function ItemsTable({ items }: Props) {
  return (
    <Section style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
      <Row style={styles.header}>
        <Column style={{ width: "60%" }}>
          <Text style={styles.headerText}>Product</Text>
        </Column>
        <Column style={{ width: "20%" }}>
          <Text style={{ ...styles.headerText, textAlign: "center" }}>Boxes</Text>
        </Column>
        <Column style={{ width: "20%" }}>
          <Text style={{ ...styles.headerText, textAlign: "center" }}>Extra units</Text>
        </Column>
      </Row>
      {items.map((item, i) => (
        <Row key={i} style={styles.cell}>
          <Column style={{ width: "60%" }}>
            <Text style={styles.cellText}>{item.productName}</Text>
          </Column>
          <Column style={{ width: "20%" }}>
            <Text style={styles.cellTextCenter}>{item.boxes}</Text>
          </Column>
          <Column style={{ width: "20%" }}>
            <Text style={styles.cellTextCenter}>{item.extraUnits}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}
