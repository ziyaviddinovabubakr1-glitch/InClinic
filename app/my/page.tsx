import PatientRecordsPage from "@/components/patient/PatientRecordsPage";

export const metadata = {
  title: "Мои записи",
  description: "История заявок и чеклисты пациента InClinic",
};

export default function MyRecordsRoute() {
  return <PatientRecordsPage />;
}
