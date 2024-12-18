use sqlx::postgres::PgRow;
use sqlx::PgPool;
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Clone)]
pub(crate) struct AppState {
    pool: PgPool,
    jwt_secret: String,
}

use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug)]
pub struct Claims {
    pub iss: String,
    pub sub: String,
    pub aud: String,
    pub exp: u64,
    pub iat: u64,
}

impl AppState {
    pub fn new(pool: PgPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }

    pub fn decrypt_token(
        &self,
        token: &str,
    ) -> Result<jsonwebtoken::TokenData<Claims>, jsonwebtoken::errors::Error> {
        let mut validation = jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256);
        validation.required_spec_claims = HashSet::new();
        validation.validate_aud = false;
        let decoding_key = jsonwebtoken::DecodingKey::from_secret(self.jwt_secret.as_ref());
        let res = jsonwebtoken::decode::<Claims>(token, &decoding_key, &validation);
        res
    }

    pub async fn verify_user(&self, user_id: &str) -> bool {
        let user_uuid = Uuid::parse_str(user_id).unwrap();
        let row = sqlx::query("SELECT * FROM auth.users WHERE id = $1")
            .bind(&user_uuid)
            .fetch_optional(&self.pool)
            .await
            .unwrap();
        row.is_some()
    }

    pub async fn get_all_guesses(&self) -> Vec<PgRow> {
        let rows = sqlx::query("SELECT * FROM public.guesses")
            .fetch_all(&self.pool)
            .await
            .unwrap();
        rows
    }
}
