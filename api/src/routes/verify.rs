use crate::postgres::AppState;
use axum::{extract::Query, extract::State, routing::get, Json, Router};
use chrono::Utc;
use serde_json::json;

pub(crate) fn routes() -> Router<AppState> {
    Router::new().route("/verify", get(verify))
}

#[derive(serde::Deserialize)]
struct TokenQuery {
    access_token: String,
}

async fn verify(
    State(state): State<AppState>,
    Query(TokenQuery { access_token }): Query<TokenQuery>,
) -> Json<serde_json::Value> {
    let decrypted = match state.decrypt_token(&access_token) {
        Ok(claims) => claims,
        Err(_) => return Json(json!({ "success": false, "reason": "invalid token" })),
    };

    let expiry = decrypted.claims.exp;
    let now = Utc::now().timestamp();

    if expiry <= now.try_into().unwrap() {
        return Json(json!({ "success": false, "reason": "token expired" }));
    }

    let user_id = decrypted.claims.sub;
    if !state.verify_user(&user_id).await {
        return Json(json!({ "success": false, "reason": "user not found" }));
    }

    println!("User {} verified", user_id);
    Json(json!({ "success": true }))
}
