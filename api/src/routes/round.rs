use crate::postgres::AppState;
use axum::{http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize, Serialize)]
struct Round {
    game_id: String,
    round_num: i32,
    map_name: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct Player {
    player_id: String,
    name: String,
    verified: bool,
}

#[derive(Debug, Deserialize)]
struct PostRoundRequest {
    round: Round,
    player: Player,
}

async fn handle_round(
    Json(post_round): Json<PostRoundRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    println!("Received Round: {:?}", post_round.player.player_id);

    if post_round.round.game_id.is_empty() || post_round.player.name.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Missing required fields" })),
        ));
    }

    Ok(Json(json!({
        "status": "success"
    })))
}

pub(crate) fn routes() -> Router<AppState> {
    Router::new().route("/round", post(handle_round))
}
