import { redirect } from "next/navigation";

// Home page. The console lives under /route53, so just redirect there.
export default function Home() {
  redirect("/route53/hosted-zones");
}
