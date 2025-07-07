import BillingTransactions from "@/components/billing-transactions";

export default function BillingTransactionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Transactions</h1>
        <p className="text-gray-600">Manage payment status and track all café transactions</p>
      </div>
      
      <BillingTransactions />
    </div>
  );
}