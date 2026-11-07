import { CalendarDays, BadgeCheck, MessageCircle, Truck } from "lucide-react";

const promises = [
  { icon: CalendarDays, label: "Open every day" },
  { icon: BadgeCheck, label: "Clear prices" },
  { icon: MessageCircle, label: "Easy ordering" },
  { icon: Truck, label: "Delivery available" },
];

export default function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Why shop with us">
      {promises.map(({ icon: Icon, label }) => (
        <div className="trust-item" key={label}>
          <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}
