import axios from 'axios';
import { z } from "zod";

export const rolesMap = {
  manager: "manager",
  admin: "admin",
  admins: "admin",
  customer: "customer",
  owner: "owner",
  offer: "offer",
  offers: "offer"
} as const;

export const AllowedRoles = z.enum(Object.keys(rolesMap) as [keyof typeof rolesMap]);

export async function handleData(rolesKey: string, receipt: string): Promise<string> {
  try {
    // Step 1: Prepare request payload for receipt data
    const receiptPayload = {
      resource_address: receipt,
    };
    
    console.log("receiptPayload:", receiptPayload);
    const payload = JSON.stringify({ resource_address: receipt });
    console.log("Payload:", payload);
    

    // Step 2: Make API request
    const response = await axios.post(
      "https://mainnet.radixdlt.com/state/non-fungible/ids",
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const amount = response.data.non_fungible_ids.total_count;
    // response.data.

    return `Current ${rolesKey} registered = ${amount}`;

  } catch (err) {
    console.error('Error in handleData:', err);
    return `Failed to fetch data for ${receipt}.`;
  }
}    
