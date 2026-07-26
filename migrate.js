import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
    import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
    
    const client = new DynamoDBClient({ region: "eu-central-1" }); // Upewnij się, że region jest prawidłowy!
    const docClient = DynamoDBDocumentClient.from(client);
    const TABLE_NAME = "SnakeLeaderboard";
    
    async function migrate() {
        console.log("Rozpoczynam pobieranie danych ze Scan...");
        const scanData = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        const items = scanData.Items || [];
        console.log(`Pobrano ${items.length} rekordów.`);
    
        // 1. Grupowanie i wybieranie najwyższego wyniku dla każdej pary gracza i pokemona
        const grouped = {};
        for (const item of items) {
            // Ignorujemy rekordy, które już są w nowym formacie (mają id zawierające '#' i pole leaderboard_id)
            if (item.id && item.id.includes("#") && item.leaderboard_id === "global") {
                continue;
            }
            
            const key = `${item.username}#${item.pokemon}`;
            if (!grouped[key] || grouped[key].score < item.score) {
                grouped[key] = item;
            }
        }

        const uniqueBestItems = Object.values(grouped);
        console.log(`Po agregacji pozostało ${uniqueBestItems.length} unikalnych rekordów do migracji.`);

        // 2. Zapisywanie nowych rekordów w nowym formacie
        for (const item of uniqueBestItems) {
            const newId = `${item.username}#${item.pokemon}`;
            console.log(`Zapisuję: ${newId} (Wynik: ${item.score})`);
            
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    id: newId,
                    username: item.username,
                    pokemon: item.pokemon,
                    score: item.score,
                    date: item.date,
                    leaderboard_id: "global"
                }
            }));
        }

        // 3. Usuwanie starych rekordów (tych, których ID nie zawierało '#')
        console.log("Rozpoczynam czyszczenie starych rekordów...");
        let deletedCount = 0;
        for (const item of items) {
            if (item.id && !item.id.includes("#")) {
                await docClient.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { id: item.id }
                }));
                deletedCount++;
            }
        }
        console.log(`Czyszczenie zakończone. Usunięto ${deletedCount} starych wierszy.`);
        console.log("Migracja ukończona pomyślnie! 🎉");
    }

    migrate().catch(err => console.error("Błąd podczas migracji:", err));
