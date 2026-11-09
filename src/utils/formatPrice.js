export default function formatPrice(amount) {
  return `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount)}`;
}
