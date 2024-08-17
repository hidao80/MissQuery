let notes = [];
let currentPage = 1;
const notesPerPage = 10;

$(document).ready(function() {
    $('#submitFile').on('click', function() {
        const file = $('#fileInput')[0].files[0];
        if (file) {
            readFile(file);
        } else {
            alert('ファイルを選択してください。');
        }
    });

    $('#searchBox').on('input', function() {
        currentPage = 1;
        filterAndDisplayNotes();
    });
});

function readFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsedData = JSON.parse(e.target.result);
            if (!Array.isArray(parsedData)) {
                throw new Error('ノートデータが見つかりません');
            }
            notes = parsedData;
            $('#fileDialog').hide();
            $('#searchBox').show();
        } catch (error) {
            alert('ファイルの解析に失敗しました。有効なMisskeyノートのエクスポートJSONファイルを選択してください。');
            console.error('エラー:', error);
        }
    };
    reader.onerror = function() {
        alert('ファイルの読み込みに失敗しました。');
    };
    reader.readAsText(file);
}

function filterAndDisplayNotes() {
    const searchTerm = $('#searchBox').val();
    let filteredNotes = notes;

    if (searchTerm) {
        const terms = searchTerm.split(/\s+/);
        const positiveTerms = terms.filter(term => !term.startsWith('-'));
        const negativeTerms = terms.filter(term => term.startsWith('-')).map(term => term.slice(1));

        filteredNotes = notes.filter(note => {
            const content = note.text.toLowerCase();
            return positiveTerms.every(term => content.includes(term.toLowerCase())) &&
                   negativeTerms.every(term => !content.includes(term.toLowerCase()));
        });

        // 正規表現での検索
        if (searchTerm.startsWith('/') && searchTerm.endsWith('/')) {
            const regex = new RegExp(searchTerm.slice(1, -1), 'i');
            filteredNotes = filteredNotes.filter(note => regex.test(note.text));
        }
    }

    if (filteredNotes.length > 0) {
        displayNotes(filteredNotes);
        displayPagination(filteredNotes.length);    
    }
}

function displayNotes(filteredNotes) {
    const startIndex = (currentPage - 1) * notesPerPage;
    const endIndex = startIndex + notesPerPage;
    const notesToDisplay = filteredNotes.slice(startIndex, endIndex);

    $('#noteContainer').empty();

    notesToDisplay.forEach(note => {
        const noteElement = $('<div class="note-card"></div>');
        noteElement.html(`
            <div class="note-content">${renderContent(note.text)}</div>
            <div class="note-footer">
                <span>${new Date(note.createdAt).toLocaleString()}</span>
                <span>リノート: ${note.renoteCount} / リアクション: ${Object.values(note.reactions).reduce((a, b) => a + b, 0)}</span>
            </div>
        `);
        $('#noteContainer').append(noteElement);
    });

    renderMath();
}

function renderContent(text) {
    // 簡易的なMisskey Flavor Markdown解釈
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>')
               .replace(/`(.*?)`/g, '<code>$1</code>')
               .replace(/\n/g, '<br>');
    return text;
}

function renderMath() {
    renderMathInElement(document.body, {
        delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}
        ]
    });
}

function displayPagination(totalNotes) {
    const totalPages = Math.ceil(totalNotes / notesPerPage);
    $('#pagination').empty();

    if (currentPage > 1) {
        $('#pagination').append('<button onclick="changePage(' + (currentPage - 1) + ')">前へ</button>');
    }

    $('#pagination').append('<span>ページ ' + currentPage + ' / ' + totalPages + '</span>');

    if (currentPage < totalPages) {
        $('#pagination').append('<button onclick="changePage(' + (currentPage + 1) + ')">次へ</button>');
    }
}

function changePage(newPage) {
    currentPage = newPage;
    filterAndDisplayNotes();
}