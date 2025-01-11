use crate::postgres::AppState;
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize, Serialize)]
struct Game {
    game_id: String,
    round_num: i16,
    guess_country: String,
    guess_lat: f32,
    guess_lng: f32,
    score: i16,
    time_spent: i64,
    game_mode: String,
    distance: f32,
}

async fn handle_game(
    State(state): State<AppState>,
    Json(game_info): Json<Game>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {

    let result = sqlx::query!(
        r#"
        INSERT INTO guesses (
            game_id, 
            round_num, 
            distance, 
            guess_country, 
            guess_lat, 
            guess_lng, 
            score, 
            time_spent,
            guess_made
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (game_id, round_num) DO UPDATE 
        SET
            distance = EXCLUDED.distance,
            guess_country = EXCLUDED.guess_country,
            guess_lat = EXCLUDED.guess_lat,
            guess_lng = EXCLUDED.guess_lng,
            score = EXCLUDED.score,
            time_spent = EXCLUDED.time_spent
        "#,
        game_info.game_id,
        game_info.round_num,
        game_info.distance as f64,
        game_info.guess_country,
        game_info.guess_lat as f64,
        game_info.guess_lng as f64,
        game_info.score as i32,
        game_info.time_spent
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => Ok(Json(json!({
            "status": "success"
        }))),
        Err(e) => {
            eprintln!("Failed to insert guess: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "message": "Failed to insert guess"
                })),
            ))
        }
    }
}

pub(crate) fn routes() -> Router<AppState> {
    Router::new().route("/guess", post(handle_game))
}
