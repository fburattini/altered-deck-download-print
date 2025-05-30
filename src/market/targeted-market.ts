import { AlteredApiClient, FilterOptions } from "./api-client"

const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDMFo0V3JVWE1xT2JtMy1CTU8xRFV5YktidFA2bldLb2VvWmE1UGJuZHhZIn0.eyJleHAiOjE3NDg2MDY0NzMsImlhdCI6MTc0ODU5OTI3MywiYXV0aF90aW1lIjoxNzQ3ODM3MzU3LCJqdGkiOiJiM2RhMTJlMC02ODYyLTRmYzAtOWI5Yi04MjliZDE4YjNmNjUiLCJpc3MiOiJodHRwczovL2F1dGguYWx0ZXJlZC5nZy9yZWFsbXMvcGxheWVycyIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJiYmUzMGI4Yi1mNjhlLTRjYjQtYWMxMS0zZjY5ZmM5ZjBlN2MiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJ3ZWIiLCJzaWQiOiI0OTRmMjg1Ni05OWZlLTQxYzEtYTU2YS1lNDI2NDkyZmRhZGUiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vYXV0aC5hbHRlcmVkLmdnIiwiaHR0cHM6Ly93d3cuYWx0ZXJlZC5nZyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib3RwX2VtYWlsIiwiZGVmYXVsdC1yb2xlcy1wbGF5ZXJzIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicHJlZmVycmVkX3VzZXJuYW1lIjoiZi5idXJhdHRpbmk5N0BnbWFpbC5jb20iLCJlbWFpbCI6ImYuYnVyYXR0aW5pOTdAZ21haWwuY29tIn0.fiM2BI1TH7uTfpTqc2aESes2knO6-k0_yXBjcBp-SPQyjQ_Q75cQWZp-RNlRUnvkS6bKXgdETWHgnVKpzoX47NQmr0irDUi1lUJx3dzvS8N_oGR23B_W95tQJfPAfrSl1q_MN9-zijtSbPcPlMuVpdZ524TOdQV-SPIuzns9WYO7CrWxOgeAtOx3Bn0WDVK-Sd3eqjQaqyvsFbbchqOMFIYmLxfDLCZUB5IFS8gToponceS1-LDNTwj6oG2fmUIHd4u6DNpOaMoBqxY-J1e7OMHFSLMZIjmVDWa0C8TNH5FlxgAx2QZQQJ-CA-xmcB_lhJ483EVg96QTFT6YLvNCEQ'

const main = async () => {
    // https://api.altered.gg/cards/stats?factions%5B%5D=YZ&inSale=true&mainCost%5B%5D=1&mainCost%5B%5D=2&mainCost%5B%5D=3&order%5Bprice%5D=ASC&rarity%5B%5D=UNIQUE&translations.name=snowball&itemsPerPage=36&locale=en-us
    // https://api.altered.gg/cards?factions%5B%5D=YZ&inSale=true&mainCost%5B%5D=1&mainCost%5B%5D=2&mainCost%5B%5D=3&order%5Bprice%5D=ASC&rarity%5B%5D=UNIQUE&translations.name=snowball&itemsPerPage=36&locale=en-us

    const name = ''
    const faction = ''
    const costs: number[] = []

    const api = 'https://api.altered.gg/cards'

    const client = new AlteredApiClient('en-US', token)
    const filters: FilterOptions = {
        cardName: name,
        factions: [faction],
        mainCost: costs,
        rarity: ['UNIQUE']
    }

    const res = await client.scrapeWithFilters(filters, false, `targeted-${name}`)

    const url = `${api}/factions[]=${faction}&inSale=true&mainCost[]=`
}

main()