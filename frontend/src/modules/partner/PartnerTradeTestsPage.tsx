import TradeTestRecordsPage from "../trade-test/TradeTestRecordsPage";

export default function PartnerTradeTestsPage() {
  return (
    <TradeTestRecordsPage
      scope="partner"
      editable={false}
      title="Trade Test Review"
      subtitle="View the trade test video and certificate that were uploaded for your candidates."
    />
  );
}
