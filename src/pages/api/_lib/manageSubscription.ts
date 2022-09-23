import { query as q } from "faunadb";
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false
) {
  const userRef = await fauna.query(
    q.Select(
      "ref",
      q.Get(q.Match(q.Index("users_by_stripe_customer_id"), customerId))
    )
  );

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
  };

  let subscriptionExists = null;

  try {
    subscriptionExists = await fauna.query(
      q.Get(
        q.Match(q.Index("subscription_by_user_ref"), subscriptionData.userId)
      )
    );
  } catch {
    subscriptionExists = null;
  }

  if (createAction && !subscriptionExists) {
    await fauna.query(
      q.Create(q.Collection("subscriptions"), {
        data: subscriptionData,
      })
    );
  } else {
    await fauna.query(
      q.Replace(
        q.Select(
          "ref",
          q.Get(
            q.Match(
              q.Index("subscription_by_user_ref"),
              subscriptionData.userId
            )
          )
        ),
        { data: subscriptionData }
      )
    );
  }

  console.log(`💾 saveSubscription`);
}
