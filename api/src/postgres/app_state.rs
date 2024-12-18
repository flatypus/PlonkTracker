use sqlx::postgres::PgRow;
use sqlx::PgPool;

#[derive(Clone)]
pub(crate) struct AppState {
    pool: PgPool,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn get_all_guesses(&self) -> Vec<PgRow> {
        let rows = sqlx::query("SELECT * FROM public.Guesses")
            .fetch_all(&self.pool)
            .await
            .unwrap();
        rows
    }
}
