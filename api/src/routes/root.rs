use axum::{routing::get, Router};

pub fn routes() -> Router {
    Router::new().route("/", get(root))
}

async fn root() -> &'static str {
    "Plonk Tracker Api v0.1"
}
