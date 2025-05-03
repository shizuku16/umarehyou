function SetFilter(){
    // もし <th> にまだフィルターアイコンがなければ自動で追加
    document.querySelectorAll('table th:not([colspan="5"]').forEach(th => {
        if (!th.querySelector('.filter-icon')) {
        const icon = document.createElement('span');
        icon.className = 'filter-icon';
        icon.textContent = '▾';
        th.appendChild(icon);
        }
    });
    // すべてのテーブルをループ
    document.querySelectorAll('table').forEach((table, tableIndex) => {
    const tbody = table.tBodies[1];
    if (!tbody) return;
    // 初期行順を保持
    const originalOrder = Array.from(tbody.rows).filter((e,index)=>index!=0);
    const ths = table.querySelectorAll('th:not([colspan="5"])');
    // 列ごとのフィルター／ソート状態
    const filterSelections = {};
    const sortStates       = {};

    ths.forEach((th, colIndex) => {
        const icon = th.querySelector('.filter-icon');
        if (!icon) return;

        icon.addEventListener('click', e => {
            if(document.querySelectorAll('.column-filter-dropdown').length>0){
                document.querySelectorAll('.column-filter-dropdown').forEach(d => d.remove());
                return
            }
        e.stopPropagation();
        // 既存ドロップダウンを全削除
        document.querySelectorAll('.column-filter-dropdown').forEach(d => d.remove());

        // 全行とユニーク値取得
        const allRows   = originalOrder;
        const allValues = Array.from(new Set(
            allRows.map(r => r.cells[colIndex].textContent.trim())
        )).sort((a,b) => a.localeCompare(b,'ja'));

        // 未選択なら全チェック
        if (!filterSelections[colIndex]) {
            filterSelections[colIndex] = new Set(allValues);
        }
        const currentSort = sortStates[colIndex] || 'none';

        // ドロップダウン本体
        const dropdown = document.createElement('div');
        dropdown.className = 'column-filter-dropdown';
        const rect = th.getBoundingClientRect();
        dropdown.style.top  = `${rect.bottom + window.scrollY}px`;
        dropdown.style.left = `${rect.left   + window.scrollX}px`;
        // 内部クリックで閉じないよう伝播停止
        dropdown.addEventListener('click', evt => evt.stopPropagation());

        // ── ソートオプション ──
        const sortDiv = document.createElement('div');
        sortDiv.className = 'column-sort-options';
        ['none','asc','desc'].forEach(mode => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type  = 'radio';
            // テーブルごと／列ごとにユニークな name
            radio.name  = `sort-opt-${tableIndex}-${colIndex}`;
            radio.value = mode;
            if (mode === currentSort) radio.checked = true;
            label.appendChild(radio);
            label.appendChild(
            document.createTextNode(
                mode === 'none' ? '元に戻す'
                : mode === 'asc' ? '昇順' : '降順'
            )
            );
            sortDiv.appendChild(label);

            radio.addEventListener('change', () => {
            // 他列のソート状態をリセット
            ths.forEach((_, j) => {
                if (j !== colIndex) sortStates[j] = 'none';
            });
            // 今回の列だけ状態保持
            sortStates[colIndex] = mode;

            // ソートして DOM 再配置
            let rowsToRender;
            if (mode === 'none') {
                rowsToRender = originalOrder.slice();
            } else {
                rowsToRender = originalOrder.slice().sort((a, b) => {
                const aText = a.cells[colIndex].textContent.trim();
                const bText = b.cells[colIndex].textContent.trim();
                const aNum = parseFloat(aText),
                        bNum = parseFloat(bText);
                const cmp = (!isNaN(aNum) && !isNaN(bNum))
                            ? aNum - bNum
                            : aText.localeCompare(bText,'ja');
                return mode === 'asc' ? cmp : -cmp;
                });
            }
            rowsToRender.forEach(r => tbody.appendChild(r));
            // ソート後にもフィルター再適用
            applyFilter();
            });
        });
        dropdown.appendChild(sortDiv);

        // ── フィルター検索ボックス ──
        const search = document.createElement('input');
        search.type        = 'text';
        search.placeholder = '値を検索...';
        search.className   = 'column-filter-search';
        dropdown.appendChild(search);

        // ── 値一覧チェックリスト ──
        const list = document.createElement('div');
        allValues.forEach(val => {
            const label = document.createElement('label');
            const cb = document.createElement('input');
            cb.type    = 'checkbox';
            cb.value   = val;
            cb.checked = filterSelections[colIndex].has(val);
            label.appendChild(cb);
            label.appendChild(document.createTextNode(' ' + val));
            list.appendChild(label);
        });
        dropdown.appendChild(list);
        document.body.appendChild(dropdown);

        // フィルター適用関数
        const applyFilter = () => {
            const checked = Array.from(
            list.querySelectorAll('input:checked')
            ).map(cb => cb.value);
            filterSelections[colIndex] = new Set(checked);
            originalOrder.forEach(r => {
            const txt = r.cells[colIndex].textContent.trim();
            r.style.display = checked.includes(txt) ? '' : 'none';
            });
            if (checked.length === allValues.length) {
            th.classList.remove('filtered');
            } else {
            th.classList.add('filtered');
            }
        };

        // イベントバインド
        list.addEventListener('change', applyFilter);
        search.addEventListener('input', () => {
            const kw = search.value.trim().toLowerCase();
            Array.from(list.children).forEach(label => {
            const txt = label.textContent.trim().toLowerCase();
            label.style.display = txt.includes(kw) ? '' : 'none';
            });
        });
        });
    });
    });

    // ドロップダウン外クリックで閉じる（共通）
    document.addEventListener('click', () => {
        document.querySelectorAll('.column-filter-dropdown').forEach(d => d.remove());
    });
};