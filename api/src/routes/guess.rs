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
    distance: f32,
}

async fn handle_guess(
    State(state): State<AppState>,
    Json(game_info): Json<Game>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    println!("Received guess: {:?}", game_info);

    let result = sqlx::query!(
        r#"
        UPDATE guesses
        SET
            distance = $3,
            guess_country = $4,
            guess_lat = $5,
            guess_lng = $6,
            score = $7,
            time_spent = $8,
            guess_made = true
        WHERE game_id = $1 AND round_num = $2
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
    Router::new().route("/guess", post(handle_guess))
}
