pub fn get_db_url() -> String {
    return std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
}