package app.kinetic.strength;

import android.app.Activity;
import android.content.Context;
import android.os.Build;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Kinetic Pro: a one-time in-app product sold through Google Play Billing.
 * Every state change is reported as {ready, price, owned?, event?} and handed to the page.
 */
final class ProStore implements PurchasesUpdatedListener {

    /** Product ID of the one-time product created in Play Console (Monetize → Products → In-app products). */
    static final String PRODUCT_ID = "kinetic_pro";

    interface Listener {
        void onProState(JSONObject state);
    }

    private final Activity activity;
    private final Listener listener;
    private final BillingClient client;
    private final List<Runnable[]> waiting = new ArrayList<>();
    private ProductDetails details;
    private boolean connecting;

    ProStore(Activity activity, Listener listener) {
        this.activity = activity;
        this.listener = listener;
        this.client = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .build();
    }

    /** True when this copy was installed by Google Play, the only place where Pro can be bought. */
    @SuppressWarnings("deprecation")
    static boolean installedFromPlay(Context context) {
        try {
            String installer;
            if (Build.VERSION.SDK_INT >= 30) {
                installer = context.getPackageManager()
                        .getInstallSourceInfo(context.getPackageName())
                        .getInstallingPackageName();
            } else {
                installer = context.getPackageManager().getInstallerPackageName(context.getPackageName());
            }
            return "com.android.vending".equals(installer);
        } catch (Exception e) {
            return false;
        }
    }

    /** Loads the price and the ownership state; event is echoed back to the page (e.g. "restored"). */
    void refresh(final String event) {
        connect(() -> queryProduct(() -> queryOwned(event)), () -> report(null, event == null ? null : "error"));
    }

    void buy() {
        if (details == null) {
            refresh("error");
            return;
        }
        connect(() -> {
            BillingFlowParams params = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(
                            BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details).build()))
                    .build();
            BillingResult result = client.launchBillingFlow(activity, params);
            if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
                refresh("restored");
            } else if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                report(null, "error");
            }
        }, () -> report(null, "error"));
    }

    void close() {
        client.endConnection();
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            boolean owned = false;
            boolean pending = false;
            for (Purchase purchase : purchases) {
                if (!purchase.getProducts().contains(PRODUCT_ID)) {
                    continue;
                }
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    acknowledge(purchase);
                    owned = true;
                } else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                    pending = true;
                }
            }
            if (owned) {
                report(true, "purchased");
            } else {
                report(null, pending ? "pending" : null);
            }
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            refresh("restored");
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            report(null, "cancelled");
        } else {
            report(null, "error");
        }
    }

    private void connect(Runnable onReady, Runnable onFail) {
        if (client.isReady()) {
            onReady.run();
            return;
        }
        waiting.add(new Runnable[] { onReady, onFail });
        if (connecting) {
            return;
        }
        connecting = true;
        client.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                activity.runOnUiThread(() -> {
                    connecting = false;
                    boolean ok = result.getResponseCode() == BillingClient.BillingResponseCode.OK;
                    List<Runnable[]> calls = new ArrayList<>(waiting);
                    waiting.clear();
                    for (Runnable[] call : calls) {
                        (ok ? call[0] : call[1]).run();
                    }
                });
            }

            @Override
            public void onBillingServiceDisconnected() {
                activity.runOnUiThread(() -> connecting = false);
            }
        });
    }

    private void queryProduct(Runnable then) {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(PRODUCT_ID)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()))
                .build();
        client.queryProductDetailsAsync(params, (result, productResult) -> activity.runOnUiThread(() -> {
            List<ProductDetails> list = productResult.getProductDetailsList();
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && list != null && !list.isEmpty()) {
                details = list.get(0);
            }
            then.run();
        }));
    }

    private void queryOwned(String event) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        client.queryPurchasesAsync(params, (result, purchases) -> activity.runOnUiThread(() -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                report(null, event == null ? null : "error");
                return;
            }
            boolean owned = false;
            for (Purchase purchase : purchases) {
                if (purchase.getProducts().contains(PRODUCT_ID)
                        && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    acknowledge(purchase);
                    owned = true;
                }
            }
            report(owned, event);
        }));
    }

    /** Google refunds purchases that are not acknowledged within three days. */
    private void acknowledge(Purchase purchase) {
        if (purchase.isAcknowledged()) {
            return;
        }
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();
        client.acknowledgePurchase(params, result -> { });
    }

    @SuppressWarnings("deprecation")
    private String price() {
        if (details == null || details.getOneTimePurchaseOfferDetails() == null) {
            return null;
        }
        return details.getOneTimePurchaseOfferDetails().getFormattedPrice();
    }

    /** owned: null keeps the page's cached state (e.g. when the store could not be reached). */
    private void report(Boolean owned, String event) {
        JSONObject state = new JSONObject();
        try {
            state.put("ready", details != null);
            String price = price();
            if (price != null) {
                state.put("price", price);
            }
            if (owned != null) {
                state.put("owned", owned.booleanValue());
            }
            if (event != null) {
                state.put("event", event);
            }
        } catch (JSONException ignored) {
            // Keys and values are plain strings and booleans.
        }
        activity.runOnUiThread(() -> listener.onProState(state));
    }
}
