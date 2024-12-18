mod postgres;
mod routes;

use crate::postgres::AppState;
use axum::{http::Method, Router};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};

const PORT: &str = "4000";

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    println!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .connect(&db_url)
        .await
        .expect("Failed to create pool");

    println!("Connected to database");

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any);

    let app = Router::new()
        .merge(routes::verify::routes())
        .with_state(AppState::new(pool, jwt_secret))
        .merge(routes::root::routes())
        .merge(routes::health::routes())
        .layer(cors);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", PORT))
        .await
        .expect("Failed to bind to port");

    println!("Server running on port {}", PORT);
    axum::serve(listener, app).await.expect("Server error");
}
