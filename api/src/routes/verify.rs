use crate::postgres::AppState;
use axum::{routing::get, Json, Router};
use serde_json::json;

pub(crate) fn routes() -> Router<AppState> {
    Router::new().route("/verify", get(verify))
}

async fn verify() -> Json<serde_json::Value> {
    Json(json!({ "success": true }))
}
