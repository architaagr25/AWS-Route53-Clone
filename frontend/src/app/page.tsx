import { redirect } from "next/navigation";

/**
 * Home page. The console lives under /route53, so visitors are sent there.
 * (Auth gating / login redirect is added in Step 11.)
 */
export default function Home() {
  redirect("/route53/hosted-zones");
}
