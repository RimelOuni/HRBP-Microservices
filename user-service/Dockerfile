# ==========================================
# Stage 1 : Build
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Auto-trust whatever cert chain is presented to reach Maven Central
# (handles corporate proxy/VPN SSL inspection with zero manual steps)
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && echo | openssl s_client -connect repo.maven.apache.org:443 -servername repo.maven.apache.org -showcerts 2>/dev/null \
       | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' > /tmp/chain.pem \
    && csplit -z -f /tmp/cert- -b '%02d.pem' /tmp/chain.pem '/-----BEGIN CERTIFICATE-----/' '{*}' \
    && for cert in /tmp/cert-*.pem; do \
         keytool -importcert -noprompt -cacerts -storepass changeit \
           -alias "auto-$(basename $cert)" -file "$cert" || true; \
       done \
    && rm -rf /tmp/*.pem /var/lib/apt/lists/*

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2 : Runtime
# ==========================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]