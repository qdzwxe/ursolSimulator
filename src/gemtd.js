let max = false;
const max_html = '<span class="max-title">M</span>';
let log = [];
//当前是迷宫记录的第几步
let log_index = 0;
//记录所有被摆放过的点{"x,y":[x,y,img,false(是否max)]}
let maze = {};
//技能花费金额
let spend = 0;
const stone = "./pics/0.jpg";
//石板图片
const padals = [
    "./pics/91.jpg",
    "./pics/92.jpg",
    "./pics/93.jpg",
    "./pics/94.jpg",
    "./pics/95.jpg",
    "./pics/96.jpg",
    "./pics/97.jpg",
    "./pics/98.jpg",
];

let first = [];
let skill = -1;
let img = "./pics/0.jpg";
let canMove = { 1: true, 3: true, 5: true, 7: true };

checkButtonLoad();

$(".clear").click(function () {
    if (log.length === 0)
        addSpend(-spend);
    else
        layer.confirm('确定清空?', {
            btn: ['确认', '取消']
        }, function (index) {
            clearMaze(true);
            onMazeChanged();
            layer.close(index);
        });
});

$(window).bind('beforeunload', function () {
    return '确定离开此页面吗？';
});

function before() {
    if (log_index === 0) return; // 不能再退了

    log_index--;
    const before = log[log_index];
    const [x, y] = before.position ?? [];
    const content = before.content;
    const key = x + "," + y;
    switch (before.action) {
        case "put":
            if (content[0]) maze[key] = [content[0], content[1]];
            else delete maze[key];
            break;
        case "max":
            max_item = Boolean(content ^ 1);
            maze[key][1] = max_item;
            break;
        case "ursol":
            ursol(x, y, true);
            addSpend(-50);
            break;
        case "switch":
            if (content) { // 第二次vs
                const [x1, y1] = content;
                // 此时已经换完位置，所以第一次的位置不是石头就退钱
                const firstKey = x1 + "," + y1;
                if (maze[firstKey][0] !== stone) addSpend(-200);

                // 然后换回位置                
                const temp = maze[firstKey];
                maze[firstKey] = maze[key];
                maze[key] = temp;

                // 再把第一次的记录补出来
                first = content;
            } else { // 第一次vs，退钱+删除记录
                first = [];
                if (maze[key][0] !== stone) addSpend(-200);
            }
            break;
        case "move":
            move((4 + content) % 8, true);
            break;
    }
    onMazeChanged();
    // console.log("上一步", before);
}

function next() {
    if (log_index === log.length) return;

    const next = log[log_index];
    const [x, y] = next.position ?? [];
    const content = next.content;
    const key = x + "," + y;
    switch (next.action) {
        case "put":
            if (content[2]) maze[key] = [content[2], false];
            else delete maze[key];
            break;
        case "max":
            maze[key][1] = content;
            break;
        case "ursol":
            ursol(x, y);
            addSpend(50);
            break;
        case "switch":
            if (content) { // 第二次vs
                // 此时还没换位置，所以第二次的位置不是石头就花钱
                if (maze[key][0] !== stone) addSpend(200);

                // 然后换位置
                const [x1, y1] = content;
                const firstKey = x1 + "," + y1;
                const temp = maze[firstKey];
                maze[firstKey] = maze[key];
                maze[key] = temp;

                // 记录删掉
                first = [];
            } else { // 第一次vs，花钱+记录
                if (maze[key][0] !== stone) addSpend(200);
                first = [x, y];
            }
            break;
        case "move":
            move(content, true);
            break;
    }
    log_index++;
    onMazeChanged();
    // console.log("下一步", next);

}

function checkMove(dir) {
    if (!dir) return;
    let ban = [[18, 4], [18, 32], [32, 4], [4, 18], [32, 18]];
    for (let i = 0; i < 9; i++) {
        ban.push([8, i]);
        ban.push([i, 8]);
        ban.push([28, 36 - i]);
        ban.push([36 - i, 28]);
    }
    for (let i = 9; i < 37; i++) {
        ban.push([-1, i]);
        ban.push([i, -1]);
        ban.push([37, 37 - i]);
        ban.push([37 - i, 37]);
    }
    for (let item in maze) {
        const [x, y] = item.split(',');
        const [x1, y1] = getPosition(x, y, dir);
        for (let a of ban) {
            if (a[0] == x1 && a[1] == y1) return false;
        }
    }
    return true;
}

function move(dir, record = false) {
    if (!dir) return;
    if (!canMove[dir]) return;
    let temp = {};
    for (let item in maze) {
        const [x, y] = item.split(',');
        const [x1, y1] = getPosition(x, y, dir);
        temp[x1 + "," + y1] = maze[item];
    }
    maze = temp;
    if (!record) addLog('move', null, dir);
    onMazeChanged()
}

function output() {
    const s = obj2B64(maze2Obj(maze));
    layer.confirm(s, { btn: ['关闭'] },
        function (index) {
            layer.close(index);
        });
}

function input() {
    const str = prompt('请输入代码（以下为范例）', '9JAKANAPARAJBLBNBPBRBJCLCOCRCJDLDODRDJEKEOERETE-')
    const obj = b642Obj(str);
    clearMaze(true);
    maze = obj;
    onMazeChanged()
}

function input2() {
    const str = prompt('请输入外部链接（以下为范例）', 'http://47.99.98.162:27010/?AGVAAAACqgAAABSQAAAApIAAAAYl');
    url2Maze(str);
}

function save(i) {
    const s = obj2B64(maze2Obj(maze));
    if (localStorage.getItem('maze_' + i)) {
        layer.confirm(`检测到 存档${i} 已有记录，是否覆盖?`, {
            btn: ['确认', '取消']
        }, function (index) {
            localStorage.setItem('maze_' + i, s);
            checkButtonLoad();
            toastr.success("保存成功");
            layer.close(index);
        });
    } else {
        localStorage.setItem('maze_' + i, s);
        checkButtonLoad();
        toastr.success("保存成功");
    }
}

function load(i) {
    const b64 = localStorage.getItem('maze_' + i)
    if (b64) {
        const obj = b642Obj(b64);
        console.log(obj)
        if (log.length != 0 || Object.keys(maze) != 0)
            layer.confirm(`即将读取 存档${i} ，会覆盖当前地图并清空记录，是否继续?`, {
                btn: ['确认', '取消']
            }, function (index) {
                maze = obj;
                onMazeChanged()
                layer.close(index);
            });
        else {
            maze = obj;
            onMazeChanged();
        }
    }
}

function onMazeChanged() {
    clearMaze();
    drawMaze();
    checkButton();
    const arr = calcDistance();
    let sum = 0;
    for (let i = 0; i < 6; i++) {
        $('#dis' + i).text((Math.round(arr[i] * 100) / 100));
        sum += arr[i];
    }
    if (sum > 9999) $('#dis').text('迷宫不通');
    else $('#dis').text((Math.round(sum * 100) / 100));
}

function drawMaze() {
    const keys = Object.keys(maze);
    if (keys.length === 0) return;
    keys.map(function (v, k) {
        const img = maze[v][0];
        if (!img) return;
        let html = '<img src="' + img + '">';
        //有max
        if (maze[v][1] === true) html = max_html + html;
        const [x, y] = v.split(",");
        $("#maze").find("ul").eq(y).find("li").eq(x).html(html);
    });
}

function addSpend(num) {
    spend += num;
    $(".spend").text(spend);
}

function checkButton() {
    // const buttons = ['before', 'next', 'left', 'right', 'up', 'down'];
    if (log_index == log.length) refreshButton("next");
    if (log_index >= 1) refreshButton("before", true);
    if (log_index < 1) refreshButton("before"); // 退到还剩最后一步了，更改样式
    if (log_index < log.length) refreshButton("next", true);
    const buttons = { 1: 'up', 3: 'right', 5: 'down', 7: 'left' }
    for (let i = 1; i <= 7; i += 2) {
        const can = checkMove(i)
        refreshButton(buttons[i], can);
        canMove[i] = can;
    }
}
function checkButtonLoad() {
    for (let i = 1; i <= 5; i++) {
        if (!localStorage.getItem('maze_' + i)) refreshButton('load' + i);
        else refreshButton('load' + i, true);
    }
}

function refreshButton(button, enable = false) {
    const btn = document.getElementById(button);
    if (enable) {
        btn.style.cursor = "pointer";
        btn.style.opacity = 1;
    } else {
        btn.style.cursor = "not-allowed";
        btn.style.opacity = 0.6;
    }
}

function clearMaze(init = false) {
    $("#maze").find("ul").find("li").not(".point").html("");
    if (init) {
        maze = {};
        log = [];
        log_index = 0;
        spend = 0;
        first = [];
    }
}

$("#menu ul").click(function () {
    $("#menu ul").removeClass("selected")
    $(this).addClass("selected")
    const index = $(this).index();
    max = false;
    //技能
    if (index < 2) {
        img = "";
        skill = $(this).index() + 1;
    } else {
        img = $(this).find("img").attr("src")
        skill = -1;
        if (index === 11) {
            max = true;
        }
    }
});

// 修改一下log的内容 {action,position,content}
// 每一步log记录操作：put, ursol, switch，和其对应坐标
// put同时记录前后石头，用于回退
// ursol仅记录坐标
// vs第二次使用时，第三个参数为第一次坐标
// notDel参数为true时，表示不清空之后记录
function addLog(action, position, content, notDel = false) {
    log[log_index] = { action, position, content };
    log_index++;
    if (!notDel) log.splice(log_index);
}

$("#maze li").click(function () {
    const type = $(this).attr("class");
    // if (type === "disable" || type === "point") return;
    if (type === "disable") return;
    const x = $(this).index();
    const y = $(this).parent().index();
    const img_item = $(this).find("img").attr("src");
    const key = x + "," + y;
    /*let max_item = false;
    if ($(this).find("span").length > 0) {
        max_item = true;
    }*/
    // max标记
    if (skill === 1) { // 标记点只能旋风
        addSpend(50);
        ursol(x, y);
        addLog('ursol', [x, y]);
    }
    else if (type === "point") return;
    else if (max) {
        if (img_item === "" || img_item === undefined || img_item === stone) return;
        max_item = Boolean(maze[key][1] ^ 1);
        maze[key][1] = max_item;
        addLog("max", [x, y], max_item);
    }
    else if (skill === -1) {
        addLog('put', [x, y], [img_item, maze[key]?.[1], img]);
        if (img) {
            // 不为空，并且选了同一个石头
            if (($(this).html() !== "") && img_item === img) delete maze[key];
            // if (img_item === img) return;
            else maze[key] = [img, false];
        } else {
            if ($(this).html() == "") return;
            delete maze[key];
        }
    } else if (skill === 2) { //vs
        // 选中禁用区域
        if (img_item === "" || img_item === undefined || padals.indexOf(img_item) > -1) return;
        // 选中非石头
        else if (img_item !== stone) addSpend(200);
        if (first.length === 0) { // 第一次选
            first = [x, y]; // 记录第一次的坐标
            addLog('switch', [x, y]);
            return;
        } else { // 第二次选
            // const img_second = $(this).find("img").attr("src");
            const [fx, fy] = first;
            const keyFirst = fx + "," + fy;
            const keySecond = x + "," + y;
            const temp = maze[keyFirst];
            maze[keyFirst] = maze[keySecond];
            maze[keySecond] = temp;
            addLog('switch', [x, y], first);
            first = [];
        }
    }
    onMazeChanged();
})

function ursol(x, y, clockwise = false) {
    let cyclone = [];
    for (let i = 0; i < 8; i++) {
        // 拿坐标
        const item = getItem(getPosition(x, y, i));
        if (item) cyclone.push([i, item]);
    }
    const len = cyclone.length;
    if (len <= 1) return; // 转了等于没转

    // 先在临时数组里面转
    const max_num = len - 1;
    let cycloneNew = [];
    if (clockwise) { // 顺时针转
        for (let i = 1; i <= max_num; i++) {
            cycloneNew.push([cyclone[i][0], cyclone[i - 1][1]])
        }
        cycloneNew.push([cyclone[0][0], cyclone[max_num][1]]);
    } else { // 逆时针转
        for (let i = 0; i < max_num; i++) {
            cycloneNew.push([cyclone[i][0], cyclone[i + 1][1]])
        }
        cycloneNew.push([cyclone[max_num][0], cyclone[0][1]]);
    }

    // 转完放到地图里面
    for (let i = 0; i <= max_num; i++) {
        const [x1, y1] = getPosition(x, y, cycloneNew[i][0]);
        const key = x1 + "," + y1;
        maze[key] = cycloneNew[i][1];
    }

    // 绘制
    onMazeChanged();
}

function getPosition(x, y, type) { // 获取当前八个方位的坐标
    x = Number(x);
    y = Number(y);
    let x1, y1;
    switch (type) {
        //西北
        case 0:
            x1 = x - 1;
            y1 = y - 1;
            break;
        //北
        case 1:
            x1 = x;
            y1 = y - 1;
            break;
        //东北
        case 2:
            x1 = x + 1;
            y1 = y - 1;
            break;
        //东
        case 3:
            x1 = x + 1;
            y1 = y;
            break;
        //东南
        case 4:
            x1 = x + 1;
            y1 = y + 1;
            break;
        //南
        case 5:
            x1 = x;
            y1 = y + 1;
            break;
        //西南
        case 6:
            x1 = x - 1;
            y1 = y + 1;
            break;
        //西
        case 7:
            x1 = x - 1;
            y1 = y;
            break;
    }
    return [x1, y1];
}

function getItem([x, y]) {
    const item = $("#maze").find("ul").eq(y).find("li").eq(x);
    //如果是禁用区域
    let kind = item.attr("class");
    if (kind === "disable" || kind === "point") return;
    //如果是空的
    const img_item = item.find('img').attr("src");
    if (img_item === "" || img_item === undefined || padals.indexOf(img_item) > -1) return;
    let is_max = false;
    if (item.find('span').length > 0) {
        is_max = true;
    }
    return [img_item, is_max];
}

function getMaze01(m = maze) {
    let maze01 = new Array(37);
    for (let y = 0; y < 37; y++) {
        let row = [];
        for (let x = 0; x < 37; x++) {
            const key = x + "," + y;
            const img_item = m?.[key]?.[0];
            if (img_item === "" || img_item === undefined || padals.indexOf(img_item) > -1) row.push(0);
            else row.push(1);
        }
        maze01[y] = row;
    }
    return maze01;
}

function setMaze(arr, clear = true) { // arr = New Array(1369)
    if (clear) clearMaze(true);
    //const len = arr.length;
    for (let y = 0; y < 37; y++) {
        for (let x = 0; x < 37; x++) {
            const index = y * 37 + x;
            // if (index >= len) return;
            const key = x + "," + y;
            if (arr[index]) maze[key] = [stone, false];
        }
    }
    onMazeChanged();
}

function url2Maze(url) {
    const b = url.split("?")?.[1];
    const arr = B64ToBin(b);
    setMaze(arr);
}

function maze2Url(m = maze) {
    const maze01 = getMaze01(m);
    let url = 'http://47.99.98.162:27010/?'
    url += MazeToB64(maze01);
    return url;
}

function calcDistance(m = maze) {
    const path_points = [[2, 4], [18, 4], [18, 32], [4, 32], [4, 18], [32, 18], [32, 34]];
    const maze01 = getMaze01(m);
    let dis = [];
    for (let i = 0; i < 6; i++) {
        dis.push(spfa(path_points[i], path_points[i + 1], maze01));
    }
    return dis;
}
const towers = [
    './pics/11.jpg', './pics/12.jpg', './pics/13.jpg', './pics/14.jpg', './pics/15.jpg',
    './pics/21.jpg', './pics/22.jpg', './pics/23.jpg', './pics/24.jpg', './pics/25.jpg',
    './pics/31.jpg', './pics/32.jpg', './pics/33.jpg', './pics/34.jpg', './pics/35.jpg',
    './pics/41.jpg', './pics/42.jpg', './pics/43.jpg', './pics/44.jpg',
    './pics/51.jpg', './pics/52.jpg', './pics/53.jpg', './pics/54.jpg',
    './pics/61.jpg', './pics/62.jpg', './pics/63.jpg', './pics/64.jpg', './pics/65.jpg', './pics/66.jpg', './pics/67.jpg',
    './pics/71.jpg', './pics/72.jpg', './pics/73.jpg', './pics/74.jpg', './pics/75.jpg',
    './pics/81.jpg', './pics/82.jpg', './pics/83.jpg',
    './pics/91.jpg', './pics/92.jpg', './pics/93.jpg', './pics/94.jpg',
    './pics/95.jpg', './pics/96.jpg', './pics/97.jpg', './pics/98.jpg',
    './pics/101.png', './pics/102.png', './pics/103.png', './pics/104.png', './pics/105.png', './pics/106.png',
    './pics/b.png', './pics/d.png', './pics/e.png', './pics/g.png',
    './pics/p.png', './pics/q.png', './pics/r.png', './pics/y.png', './pics/0.jpg'
];

//function 

function maze2Obj(m = maze) {
    let obj = {};
    for (let key in m) {
        const item = m[key][0];
        const keyPlus = (m[key][1] ? '+' : '') + key;
        obj[item] = (obj[item] ?? []).concat(keyPlus);
    }
    return obj;
}

function obj2B64(obj) {
    let str = '';
    for (let key in obj) {
        if (!key) continue;
        const index = towers.indexOf(key);
        const t64 = b64t[index]; // tower
        let pSum = '';
        let pMax = '';
        for (let item of obj[key]) {
            const max = item.indexOf('+') > -1 ? true : false;
            let [x, y] = item.split(",")
            x = Number(x);
            const p64 = b64t[x] + b64t[y]; // position
            if (max) pMax += p64;
            else pSum += p64;
        }
        str += t64 + pSum;
        if (pMax != '') str += '+' + pMax;
        str += '-';
    }
    return str;
}

function b642Obj(b) {
    const tower = b.split('-');
    let obj = {};
    for (let t of tower) {
        if (!t) continue;
        const img = towers[b64t.indexOf(t[0])];
        if (!img) continue;
        const [pSum, pMax] = t.slice(1).split('+');
        const len1 = pSum?.length;
        const len2 = pMax?.length;
        if (len1) {
            for (let i = 0; i < len1 / 2; i++) {
                const x = b64t.indexOf(pSum[2 * i]);
                const y = b64t.indexOf(pSum[2 * i + 1]);
                if (x < 0 || y < 0) continue;
                obj[x + "," + y] = [img, false];
            }
        }
        if (len2) {
            for (let i = 0; i < len2 / 2; i++) {
                const x = b64t.indexOf(pMax[2 * i]);
                const y = b64t.indexOf(pMax[2 * i + 1]);
                if (x < 0 || y < 0) continue;
                obj[x + "," + y] = [img, true];
            }
        }
    }
    return obj;
}
// modified from 47.99.98.162:27010

// copy from 47.99.98.162:27010
const b64t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890+-";

function BinToB64(arr) {
    var a = 0, c = 0, res = "";
    for (var i = 0; i < arr.length; i++) {
        a = a * 2 + arr[i];
        c++;
        if (c == 6) {
            res += b64t[a];
            c = a = 0;
        }
    }
    if (c > 0) {
        res += b64t[a];
    }
    return res;
}


function B64ToBin(b) {
    if (typeof (b) != "string") return null;
    var res = [];
    for (var a of b) {
        var x = b64t.indexOf(a);
        for (var i = 5; i >= 0; i--) {
            res.push(x >> i & 1);
        }
    }
    return res;
}

function MazeToB64(m) {
    var flat_maze = [];
    for (var i of m) {
        for (var j of i) {
            flat_maze.push(j);
        }
    }
    var b64 = BinToB64(flat_maze);
    b64 = b64.replace(/(A*$)/g, "")
    if (b64 == "") b64 = "A";
    return b64;
}

function spfa(sp, ep, maze) {
    var dis = new Array(37);
    var inq = new Array(37);
    for (var i = 0; i < 37; i++) {
        dis[i] = new Array(37);
        inq[i] = new Array(37);
        for (var j = 0; j < 37; j++) {
            dis[i][j] = 9999;
            inq[i][j] = 0;
        }
    }
    var q = [sp];
    inq[sp[0]][sp[1]] = 1;
    dis[sp[0]][sp[1]] = 0;
    var ddx = [0, 0, 1, -1, 1, 1, -1, -1];
    var ddy = [1, -1, 0, 0, 1, -1, 1, -1];
    var sq2 = Math.sqrt(2);
    //spfa
    for (var l = 0; l < q.length; l++) {
        var x = q[l][0];
        var y = q[l][1];
        var d = dis[x][y];
        inq[x][y] = 0;
        for (var i = 0; i < 8; i++) {
            var dx = x + ddx[i];
            var dy = y + ddy[i];
            var dd = d + (i < 4 ? 1 : sq2);
            if (dx >= 0 && dx < 37 && dy >= 0 && dy < 37) {
                if (maze[dx][dy] == 0 && (maze[dx][y] == 0 || maze[x][dy] == 0)) {
                    if (dd < dis[dx][dy]) {
                        dis[dx][dy] = dd;
                        if (!inq[dx][dy]) {
                            inq[dx][dy] = 1;
                            q.push([dx, dy]);
                        }
                    }
                }
            }
        }
    }
    return dis[ep[0]][ep[1]];
}