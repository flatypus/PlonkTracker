use crate::postgres::AppState;
use axum::{
    body::Body,
    extract::State,
    http::{HeaderMap, Request, StatusCode},
    middleware::Next,
    response::Response,
};
use chrono::Utc;

pub async fn auth(
    headers: HeaderMap,
    State(state): State<AppState>,
    request: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = headers
        .get("Authorization")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .to_str()
        .map_err(|_| StatusCode::UNAUTHORIZED)?
        .trim_start_matches("Bearer ");

    let decrypted = match state.decrypt_token(&token) {
        Ok(claims) => claims,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    let expiry = decrypted.claims.exp;
    let now = Utc::now().timestamp();

    if expiry <= now.try_into().unwrap() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let user_id = decrypted.claims.sub;
    if !state.verify_user(&user_id).await {
        return Err(StatusCode::UNAUTHORIZED);
    }

    println!("User {} verified", user_id);

    let mut request = request;
    request.extensions_mut().insert(user_id);

    // Continue to the next middleware or handler
    Ok(next.run(request).await)
}
