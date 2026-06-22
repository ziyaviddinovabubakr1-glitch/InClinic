import type { MetadataRoute } from "next";
import { isIndexingBlocked } from "@/lib/site-privacy";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingBlocked()) {
    return { rules: { userAgent: "*", allow: "/" } };
  }
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
