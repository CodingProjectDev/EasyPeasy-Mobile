import { File } from "expo-file-system";
import { Platform } from "react-native";

import type {
  PlaceOrderPayload,
  PlaceOrderResult,
  SellSubmission,
} from "@/types/order";

function apiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_STORE_API_URL?.trim();

  if (!value) {
    throw new Error("EXPO_PUBLIC_STORE_API_URL is missing from .env.");
  }

  return value.replace(/\/+$/, "");
}

async function responseJson(response: Response) {
  return response.json().catch(() => ({}));
}

function apiError(payload: Record<string, unknown>, fallback: string) {
  const messages = [payload.error, payload.details, payload.hint].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  return new Error(messages.join("\n") || fallback);
}

export async function uploadPaymentProof(
  file: {
    uri: string;
    name: string;
    type: string;
  },
  accessToken: string,
) {
  const form = new FormData();

  if (Platform.OS === "web") {
    const fileResponse = await fetch(file.uri);
    const blob = await fileResponse.blob();

    form.append("file", blob, file.name);
  } else {
    const nativeFile = new File(file.uri);

    form.append("file", nativeFile, file.name);
  }

  const response = await fetch(`${apiBaseUrl()}/api/payment-proof`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  const payload = (await responseJson(response)) as Record<string, unknown>;

  if (!response.ok) {
    throw apiError(payload, "Payment proof upload failed.");
  }

  const path = typeof payload.path === "string" ? payload.path : "";

  if (!path) {
    throw new Error("Payment proof uploaded without a storage path.");
  }

  return path;
}

export async function placeOrder(
  payload: PlaceOrderPayload,
  accessToken: string,
) {
  const response = await fetch(`${apiBaseUrl()}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = (await responseJson(response)) as Record<string, unknown>;

  if (!response.ok) {
    throw apiError(result, "Could not place order.");
  }

  if (typeof result.orderId !== "string" || !result.orderId) {
    throw new Error("Order was created without an order ID.");
  }

  return result as unknown as PlaceOrderResult;
}

async function currentAccessToken() {
  const { supabase } = await import("@/lib/supabase");

  const { data } = await supabase.auth.getSession();

  return data.session?.access_token || "";
}

export async function sendOrderConfirmation(
  orderId: string,
  accessToken: string,
) {
  const response = await fetch(
    `${apiBaseUrl()}/api/customer/order-confirmation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ orderId }),
    },
  );

  const payload = (await responseJson(response)) as Record<string, unknown>;

  if (!response.ok) {
    throw apiError(payload, "Could not send confirmation email.");
  }

  return payload;
}

export async function updateProductNotification(
  productId: string,
  action: "cart" | "wishlist",
  operation: "schedule" | "cancel",
) {
  const accessToken = await currentAccessToken();

  if (!accessToken) {
    return;
  }

  const response = await fetch(
    `${apiBaseUrl()}/api/customer/product-notification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        productId,
        action,
        operation,
      }),
    },
  );

  if (!response.ok) {
    const payload = (await responseJson(response)) as Record<string, unknown>;

    console.warn(apiError(payload, "Product reminder update failed.").message);
  }
}

export async function uploadSellPhoto(
  file: {
    uri: string;
    name: string;
    type: string;
  },
  submissionId: string,
  accessToken: string,
) {
  const form = new FormData();

  if (Platform.OS === "web") {
    const fileResponse = await fetch(file.uri);
    const blob = await fileResponse.blob();

    form.append("file", blob, file.name);
  } else {
    const nativeFile = new File(file.uri);

    form.append("file", nativeFile, file.name);
  }

  form.append("submissionId", submissionId);

  const response = await fetch(`${apiBaseUrl()}/api/sell/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  const payload = (await responseJson(response)) as Record<string, unknown>;

  if (!response.ok) {
    throw apiError(payload, "Could not upload item photo.");
  }

  if (typeof payload.url !== "string" || typeof payload.path !== "string") {
    throw new Error("Photo upload returned incomplete information.");
  }

  return {
    url: payload.url,
    path: payload.path,
  };
}

export async function cleanupSellPhotos(paths: string[], accessToken: string) {
  if (!paths.length) {
    return;
  }

  await fetch(`${apiBaseUrl()}/api/sell/images`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ paths }),
  });
}

export async function submitSellRequest(
  payload: Record<string, unknown>,
  accessToken: string,
) {
  const response = await fetch(`${apiBaseUrl()}/api/sell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = (await responseJson(response)) as Record<string, unknown>;

  if (!response.ok) {
    throw apiError(result, "Could not submit your item.");
  }

  return result;
}

export async function loadSellRequests(accessToken: string) {
  const response = await fetch(`${apiBaseUrl()}/api/sell`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = (await responseJson(response)) as Record<string, unknown>;

  if (!response.ok) {
    throw apiError(result, "Could not load selling items.");
  }

  return Array.isArray(result.submissions)
    ? (result.submissions as SellSubmission[])
    : [];
}

export async function sendContactMessage(payload: {
  name: string;
  email: string;
  orderNumber: string;
  message: string;
}) {
  const response = await fetch(`${apiBaseUrl()}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await responseJson(response)) as Record<string, unknown>;

  if (!response.ok) {
    throw apiError(result, "Could not send your message.");
  }

  return result;
}
