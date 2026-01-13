const cheerio = require('cheerio');

const html = `
<table width="99%" border="0" cellpadding="0" cellspacing="0">
    <tr align="center" class="tCinza">
        <td rowspan="2">
            <a href="...">0005095-91.2024.8.05.0248</a>
        </td>
        <td align="center">NORMAL</td>
        <td width="20%" rowspan="2">COMPANHIA DE ELETRICIDADE...</td>
        <td valign="top" rowspan="2">
            <table><tr><td>Nested</td></tr></table>
        </td>
        <td rowspan="2">10/12/24</td>
        <td rowspan="2"><font color="RED">On-line</font></td>
        <td rowspan="2">-</td>
        <td width="10%" rowspan="2"><font color="#FF0000"><strong>21/01/25</strong></font></td>
        <td rowspan="2">10/12/24</td>
        <td width="20%" rowspan="2">Prazo de leitura expirado</td>
        <!-- ... -->
    </tr>
</table>
`;

const $ = cheerio.load(html);

$('tr').each((i, row) => {
    const el = $(row);
    // Use > to ensure direct children only! This is Key for nested tables.
    const cols = el.children('td');
    
    // Check if it's a main row
    if (cols.length > 5) {
        const text = el.text();
        const npuMatch = text.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
        
        if (npuMatch) {
            console.log("Found NPU via Regex:", npuMatch[0]);
            
            // Try Column extraction
            // Col 0: NPU
            // Col 4: Post
            // Col 7: Ceincia
            // Col 8: Entrada
            
            const npuCol = $(cols[0]).text().trim();
            const postCol = $(cols[4]).text().trim();
            const cienciaCol = $(cols[7]).text().trim();
            const entradaCol = $(cols[8]).text().trim();
            
            console.log("Cols:", { npuCol, postCol, cienciaCol, entradaCol });
        }
    }
});
