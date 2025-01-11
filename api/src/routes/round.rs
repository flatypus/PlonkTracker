use crate::postgres::AppState;
use axum::{http::StatusCode, routing::post, Json, Router};
use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

use crate::get_db_url;

#[derive(Serialize, Deserialize, Debug, sqlx::Type)]
#[sqlx(type_name = "game_modes", rename_all = "UPPERCASE")]
pub enum GameModes {
    Practice,
    Duel,
}

#[derive(Debug, Deserialize, Serialize, sqlx::Type)]
#[sqlx(type_name = "view_limitation", rename_all = "UPPERCASE")]
pub enum ViewLimitation {
    M,
    Nm,
    Nmpz,
}

#[derive(Debug, Deserialize, Serialize)]
struct Round {
    game_id: String,
    round_num: i16,
    map_name: String,
    actual_country: String,
    actual_lat: BigDecimal,
    actual_lng: BigDecimal,
    game_mode: String,
    map_id: String,
    pano_id: String,
    time_allowed: i64,
    view_limitation: String,
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

// TODO: Insert actual data within handle_round.

use axum::extract::Extension;

async fn handle_round(
    Extension(user_id): Extension<String>,
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

    let player_result = sqlx::query!(
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

    let gm = match post_round.round.game_mode.as_str() {
        "practice" => GameModes::Practice,
        _ => GameModes::Duel,
    };

    let vl = match post_round.round.view_limitation.as_str() {
        "nmpz" => ViewLimitation::Nmpz,
        "nm" => ViewLimitation::Nm,
        _ => ViewLimitation::M,
    };

    let round_result = sqlx::query!(
        r#"
        INSERT INTO guesses (
            game_id,
            round_num,
            map_name,
            actual_country,
            actual_lat,
            actual_lng,
            map_id,
            pano_id,
            time_allowed,
            user_id,
            game_mode,
            view_limitation
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::GAME_MODES, $12::VIEW_LIMITATION)
        ON CONFLICT (game_id, round_num) DO UPDATE
        SET
            game_id = EXCLUDED.game_id,
            round_num = EXCLUDED.round_num,
            map_name = EXCLUDED.map_name,
            actual_country = EXCLUDED.actual_country,
            actual_lat = EXCLUDED.actual_lat,
            actual_lng = EXCLUDED.actual_lng,
            map_id = EXCLUDED.map_id,
            pano_id = EXCLUDED.pano_id,
            time_allowed = EXCLUDED.time_allowed,
            game_mode = EXCLUDED.game_mode,
            view_limitation = EXCLUDED.view_limitation
        "#,
        post_round.round.game_id,
        post_round.round.round_num,
        post_round.round.map_name,
        post_round.round.actual_country,
        post_round.round.actual_lat,
        post_round.round.actual_lng,
        post_round.round.map_id,
        post_round.round.pano_id,
        post_round.round.time_allowed,
        Uuid::parse_str(&user_id).map_err(|_| (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Invalid user_id" }))
        ))?,
        gm as GameModes,
        vl as ViewLimitation
    )
    .execute(&pool)
    .await;

    match (player_result, round_result) {
        (Ok(_), Ok(_)) => Ok(Json(json!({
        "status": "success"
        }))),
        (Err(e), _) | (_, Err(e)) => {
            eprintln!("Failed to insert data: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                "status": "error",
                "message": "Failed to insert data"
                })),
            ))
        }
    }
}

pub(crate) fn routes() -> Router<AppState> {
    Router::new().route("/round", post(handle_round))
}
