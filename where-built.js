(function () {
  "use strict";
  var monthSelect = document.getElementById("place-month");
  var prefectureSelect = document.getElementById("place-prefecture");
  var citySelect = document.getElementById("place-city");
  var ranking = document.getElementById("place-ranking-list");
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function count(value) { return value === null ? "—" : Number(value).toLocaleString("ja-JP"); }
  function monthLabel(month) {
    var parts = month.split("-");
    return parts[0] + "年" + Number(parts[1]) + "月";
  }
  fetch("housing_starts.json", { cache: "no-store" }).then(function (response) {
    if (!response.ok) throw Error("housing starts");
    return response.json();
  }).then(function (data) {
    var rows = data.months;
    if (rows.length !== 12) throw Error("Expected 12 months");
    var latest = rows[rows.length - 1];
    monthSelect.innerHTML = rows.slice().reverse().map(function (row) {
      return '<option value="' + esc(row.month) + '">' + monthLabel(row.month) + "</option>";
    }).join("");
    prefectureSelect.innerHTML = '<option value="all">全国</option>' + latest.prefectures.map(function (row) {
      return '<option value="' + esc(row.code) + '">' + esc(row.name) + "</option>";
    }).join("");
    monthSelect.value = latest.month;
    prefectureSelect.value = "23";

    function cityOptions() {
      var prefecture = prefectureSelect.value;
      citySelect.disabled = prefecture === "all";
      if (prefecture === "all") {
        citySelect.innerHTML = '<option value="">地域を選択してください</option>';
        return;
      }
      var selected = citySelect.value;
      var cities = latest.cities.filter(function (city) { return city.code.slice(0, 2) === prefecture; });
      cities.sort(function (a, b) { return a.name.localeCompare(b.name, "ja"); });
      citySelect.innerHTML = '<option value="">都道府県全体</option>' + cities.map(function (city) {
        return '<option value="' + esc(city.code) + '">' + esc(city.name) + "</option>";
      }).join("");
      if (cities.some(function (city) { return city.code === selected; })) citySelect.value = selected;
      else if (prefecture === "23") citySelect.value = "23203";
    }

    function render() {
      var month = rows.find(function (row) { return row.month === monthSelect.value; });
      document.getElementById("place-source").href = month.source;
      var prefCode = prefectureSelect.value;
      var prefecture = month.prefectures.find(function (row) { return row.code === prefCode; });
      var cityCode = citySelect.value;
      var city = month.cities.find(function (row) { return row.code === cityCode; });
      var cityName = citySelect.selectedOptions[0] ? citySelect.selectedOptions[0].textContent : "";
      document.getElementById("place-national").textContent = count(month.national);
      document.getElementById("place-prefecture-label").textContent = prefecture ? prefecture.name : "都道府県";
      document.getElementById("place-prefecture-total").textContent = count(prefecture ? prefecture.starts : null);
      document.getElementById("place-city-label").textContent = cityCode ? cityName : "市・区";
      document.getElementById("place-city-total").textContent = count(city ? city.starts : null);

      var series = rows.map(function (row) {
        var value = row.national;
        if (prefCode !== "all") {
          var pref = row.prefectures.find(function (item) { return item.code === prefCode; });
          value = pref ? pref.starts : null;
          if (cityCode) {
            var item = row.cities.find(function (entry) { return entry.code === cityCode; });
            value = item ? item.starts : null;
          }
        }
        return { month: row.month, value: value };
      });
      var title = cityCode ? cityName : prefecture ? prefecture.name : "全国";
      document.getElementById("place-trend-title").textContent = title + "の月別着工";
      var maximum = Math.max.apply(null, series.map(function (row) { return row.value || 0; })) || 1;
      document.getElementById("place-monthly-bars").innerHTML = series.map(function (row) {
        var height = row.value === null ? 0 : Math.max(3, Math.round(row.value / maximum * 104));
        return '<div class="place-month-column' + (row.month === month.month ? ' selected' : '') + '"><span class="place-bar-value">' + count(row.value) + '</span><span class="place-bar" style="height:' + height + 'px"></span><span class="place-bar-month">' + Number(row.month.slice(5)) + '月</span></div>';
      }).join("");
      document.getElementById("place-monthly-bars").setAttribute("aria-label", title + "の新設一戸建て着工。" + series.map(function (row) {
        return monthLabel(row.month) + count(row.value) + "戸";
      }).join("、"));

      document.getElementById("place-ranking-title").textContent = prefecture ? prefecture.name + "内の地域（上位10）" : "都道府県別（上位10）";
      document.getElementById("place-ranking-month").textContent = monthLabel(month.month);
      var items = prefecture ? month.cities.filter(function (entry) {
        return entry.code.slice(0, 2) === prefCode && !(entry.name.endsWith("区") && prefCode !== "13");
      }) : month.prefectures;
      items = items.slice().sort(function (a, b) { return b.starts - a.starts; }).slice(0, 10);
      var top = items.length ? items[0].starts : 1;
      ranking.innerHTML = items.map(function (item, index) {
        return '<button type="button" class="place-rank-row' + (item.code === cityCode ? ' selected' : '') + '" data-place-code="' + esc(item.code) + '"' + (prefecture ? '' : ' disabled') + '><span class="place-rank-number">' + (index + 1) + '</span><span class="place-rank-name">' + esc(item.name) + '</span><span class="place-rank-track"><i style="width:' + Math.round(item.starts / top * 100) + '%"></i></span><b>' + count(item.starts) + '戸</b></button>';
      }).join("");
    }

    ranking.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-place-code]");
      if (!button || button.disabled) return;
      citySelect.value = button.getAttribute("data-place-code");
      render();
    });
    monthSelect.addEventListener("change", render);
    prefectureSelect.addEventListener("change", function () { cityOptions(); render(); });
    citySelect.addEventListener("change", render);
    cityOptions();
    render();
  }).catch(function (error) {
    document.getElementById("place-monthly-bars").textContent = "地域別データを読み込めませんでした。";
    console.error(error);
  });
})();
