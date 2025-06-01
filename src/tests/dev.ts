const main = async () => {
    const filters = {
        name: 'cloth',
    }

    const response = await fetch(`http://localhost:3001/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          options: {
            resultLimit: 0, // Get all results by default
            sortByPrice: true,
            inSaleOnly: true,
          }
        })
      });

      const payload = await response.json();

      console.log(payload)
}

main()