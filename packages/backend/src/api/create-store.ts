import { Request, Response } from "express";
import { getSupabase } from "../utils/supabase";
import { deriveNameFromUrl } from "../utils/utils";
import { StoreInput } from "../types";

export async function handleCreateStore(req: Request, res: Response) {
  const requestId = `create_store_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[${requestId}] Incoming create store request`);

  try {
    const body = req.body as StoreInput;
    console.log(`[${requestId}] Body preview:`, {
      url: body.url,
      hasAdminToken: Boolean(body.adminAccessToken),
      providedNetworks: body.networks,
      providedAsset: body.asset,
    });

    const { url, adminAccessToken } = body;
    if (!url || !adminAccessToken) {
      console.warn(`[${requestId}] Missing url/adminAccessToken`);
      return res.status(400).json({
        error: "Missing required fields: url, adminAccessToken",
      });
    }

    const name = body.name?.trim() || deriveNameFromUrl(url);
    const description = body.description?.trim() || null;
    const currency = body.currency || "USD";
    const networks = body.networks || ["monad-testnet"];
    const asset = body.asset || "MON";
    const agentMetadata =
      body.agentMetadata || {
        minOrder: "5.00",
        supportsPhysical: true,
        supportsDigital: false,
      };

    const supabase = getSupabase();

    const id = `store_${crypto.randomUUID().slice(0, 8)}`;
    console.log(`[${requestId}] Generated store id ${id}`);

    const shopDomain = (() => {
      try {
        return new URL(url).hostname;
      } catch (err) {
        console.warn(`[${requestId}] Failed to parse shop domain from url ${url}:`, err);
        return null;
      }
    })();

    console.log(`[${requestId}] Inserting store into Supabase`, {
      id,
      name,
      shopDomain,
      currency,
      networks,
      asset,
    });

    const { error } = await supabase.from("stores").insert({
      id,
      name,
      url,
      shop_domain: shopDomain,
      admin_access_token: adminAccessToken,
      description,
      currency,
      networks,
      asset,
      agent_metadata: agentMetadata,
    });

    if (error) {
      console.error(`[${requestId}] Supabase insert failed`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return res.status(500).json({
        error: "Failed to insert store",
        details: error.message,
      });
    }

    console.log(`[${requestId}] Store inserted successfully`);
    return res.status(200).json({
      id,
      name,
      description,
      currency,
      networks,
      asset,
      agentMetadata,
    });
  } catch (e: any) {
    console.error(`[create_store] Unexpected error`, e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
      details: e?.stack,
    });
  }
}
