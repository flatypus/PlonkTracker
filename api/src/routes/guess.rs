use crate::postgres::AppState;
use axum::{http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::postgres::PgPoolOptions;

use crate::get_db_url;

#[derive(Debug, Deserialize, Serialize, sqlx::Type)]
#[sqlx(type_name = "GAME_MODES", rename_all = "UPPERCASE")]
enum GameModes {
    Practice,
    Duel,
}

#[derive(Debug, Deserialize)]
struct Game {
    distance: f32,
    game_id: String,
    guess_country: String,
    guess_lat: f32,
    guess_lng: f32,
    round_num: i32,
    score: i16,
    time_spent: i32,
    game_mode: String,
}

async fn handle_game(
    Json(game_info): Json<Game>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    println!("Received Guess: {:?}", game_info.game_id);
    println!("Game Stats:");
    println!("Distance: {}", game_info.distance);
    println!("Guess Country: {}", game_info.guess_country);
    println!("Time Spent: {}", game_info.time_spent);
    println!("Guess Latitude: {}", game_info.guess_lat);
    println!("Guess Longitude: {}", game_info.guess_lng);
    println!("Game Mode: {}", game_info.game_mode);

    let pool = PgPoolOptions::new()
        .connect(&get_db_url())
        .await
        .expect("Failed to create pool");

    let gm = match game_info.game_mode.as_str() {
        "standard" => GameModes::Practice,
        _ => GameModes::Duel,
    };
    println!("Game Mode: {:?}", gm);

    let result = sqlx::query!(
        r#"
        INSERT INTO guesses (game_id, round_num, distance, guess_country, guess_lat, guess_lng, score, time_spent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (game_id) DO UPDATE
        SET round_num = EXCLUDED.round_num,
            distance = EXCLUDED.distance,
            guess_country = EXCLUDED.guess_country,
            guess_lat = EXCLUDED.guess_lat,
            guess_lng = EXCLUDED.guess_lng,
            score = EXCLUDED.score,
            time_spent = EXCLUDED.time_spent
        "#,
        game_info.game_id,
        game_info.round_num as i32,
        game_info.distance as f64,
        game_info.guess_country,
        game_info.guess_lat as f64,
        game_info.guess_lng as f64,
        game_info.score as i32,
        game_info.time_spent as i64
    )
    .execute(&pool)
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
