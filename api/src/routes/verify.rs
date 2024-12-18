use crate::postgres::AppState;
use axum::{extract::State, routing::get, Json, Router};
use serde_json::json;

pub(crate) fn routes() -> Router<AppState> {
    Router::new().route("/verify", get(verify))
}

async fn verify(State(state): State<AppState>) -> Json<serde_json::Value> {
    state.get_all_guesses().await;
    // let result = store.verify().await;
    Json(json!({ "result": "ok" }))
}
