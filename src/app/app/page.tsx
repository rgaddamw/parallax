import { InterviewSessionProvider } from "@/context/InterviewSessionProvider";
import { InterviewSimulator } from "@/components/parallax/InterviewSimulator";

export default function SimulatorPage() {
  return (
    <InterviewSessionProvider>
      <InterviewSimulator />
    </InterviewSessionProvider>
  );
}
