use crate::postgres::AppState;
use axum::{http::StatusCode, routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize, Serialize)]
struct Game {
    distance: i32,
    guess_country: String,
    guess_lat: f32,
    guess_lng: f32,
}

async fn handle_game(
    Json(game_info): Json<Game>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    println!("Received Round: {:?}", game_info);

    Ok(Json(json!({
        "status": "success"
    })))
}

pub(crate) fn routes() -> Router<AppState> {
    Router::new().route("/guess", get(handle_game))
}
