export POSTGRES_URI='postgres://awakentrading_user:hrnkKOn1scMjTX2kmKcaK7EHaG6bUBPl@dpg-cmqtds6g1b2c73d85ap0-a.oregon-postgres.render.com/awakentrading'
export POSTGRES_SSL='true'
export MAGIC_SECRET_KEY='sk_live_94E1BB088D7154CC'
export ALGOLIA_API_KEY='f6a03b95c2525c16c8e6ba25aba58c40'
export ALGOLIA_APP_ID='5P9IKKD453'
export NODE_ENV='production'

echo "SSL: $POSTGRES_SSL"
echo "URI: $MAGIC_SECRET_KEY"
echo "Done setting environment variables for production."