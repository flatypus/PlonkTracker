use crate::postgres::AppState;
use axum::{http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::postgres::PgPoolOptions;

use crate::get_db_url;

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
    country: String,
    verified: bool,
    pin_id: String,
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
    println!(
        "Round Stats: game_id: {}, round_num: {}, map_name: {}",
        post_round.round.game_id, post_round.round.round_num, post_round.round.map_name
    );

    if post_round.round.game_id.is_empty() || post_round.player.name.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Missing required fields" })),
        ));
    }

    let pool = PgPoolOptions::new()
        .connect(&get_db_url())
        .await
        .expect("Failed to create pool");

    let result = sqlx::query!(
        r#"
        INSERT INTO players (player_id, name, country, verified, pin)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (player_id) DO UPDATE
        SET name = EXCLUDED.name,
            country = EXCLUDED.country,
            verified = EXCLUDED.verified,
            pin = EXCLUDED.pin
        "#,
        post_round.player.player_id,
        post_round.player.name,
        post_round.player.country,
        post_round.player.verified,
        post_round.player.pin_id
    )
    .execute(&pool)
    .await;

    match result {
        Ok(_) => Ok(Json(json!({
            "status": "success"
        }))),
        Err(e) => {
            eprintln!("Failed to insert round: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "message": "Failed to insert round"
                })),
            ))
        }
    }
}

pub(crate) fn routes() -> Router<AppState> {
    Router::new().route("/round", post(handle_round))
}
