function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
}

var filters = angular.module('aerospike.stellar.filters', []);

filters
    .filter('checkmark', function () {
        return function (input) {
            var result = input;
            if (input === 'true' || input === 'yes') {
                result = '\u2713'; // checked
            } else if (input === 'false' || input === 'no') {
                result = '\u2718'; // unchecked
            }
            return result;
        };
    })
    .filter('priceTag', function () {
        return function (input, currency) {
            return (input === 0 || input === 'undefined' || input == null) ? 'FREE' : currency + ' ' + input;
        };
    })
    .filter('size', function ($sce) {
        return function (input) {
            var sizeStr = "MB";
            if (input >= 1000) {
                sizeStr = "GB";
            }
            return $sce.trustAsHtml('<span class="h3 font-semibold text-left text-danger">' + (input / 1000) + '</span><span class="h4 font-thin text-left text-danger">' + sizeStr + '</span>');
        };
    })
    .filter('sizeBytesToHuman', function ($sce) {
        return function (input) {
            if (!input) {
                return input;
            }

            var sizeStr;
            if (input < 1024) {
                sizeStr = "Bytes";
            } else if (input < Math.pow(1024, 2)) {
                sizeStr = "KiB";
                input /= 1024;
            } else if (input < Math.pow(1024, 3)) {
                sizeStr = "MiB";
                input /= Math.pow(1024, 2);
            } else if (input < Math.pow(1024, 4)) {
                sizeStr = "GiB";
                input /= Math.pow(1024, 3);
            } else {
                sizeStr = "TiB";
                input /= Math.pow(1024, 4);
            }
            return (Math.round(input * 100) / 100) + ' ' + sizeStr;
        };
    })
    .filter('highlightStatus', function ($sce) {
        return function (input) {
            var fmtClass = 'label-success';
            switch (input) {
            case 'Pending':
                fmtClass = 'label-warning';
                break;
            case 'Ready':
                fmtClass = 'label-success';
                break;
            case 'Successful':
                fmtClass = 'label-success';
                break;
            case 'Failed':
                fmtClass = 'label-danger';
                break;
            }
            return $sce.trustAsHtml('<span class="label ' + fmtClass + '">' + input + '</span>');
        };
    })
    .filter('highlightSnapshotStatus', function ($sce) {
        return function (input) {
            var fmtClass = 'label-warning';
            switch (input) {
            case 'Ready':
                fmtClass = 'label-success';
                break;
            case 'Failed':
                fmtClass = 'label-danger';
                break;
            }
            return $sce.trustAsHtml('<span class="label ' + fmtClass + '">' + input + '</span>');
        };
    })
    .filter('na', function () {
        return function (input) {
            var res = '-';
            if (input == null || input === 'undefined' || input == '' || input == 0)
                return '-';
            else
                return input

        };
    })
    .filter('timelineInverted', function () {
        return function (input) {
            return input % 2 == 0 ? '' : '-inverted'
        };
    })
    .filter('alertIcon', function () {
        return function (input) {
            input == input || 999;
            switch (input) {
            case 0:
                return 'fa-check';
            case 1:
                return 'fa-warning';
            case 2:
                return 'fa-bolt';
            default:
                return 'fa-check';
            }
        };
    })
    .filter('alertStatusToLevel', function () {
        return function (input) {
            input == input || '';
            switch (input) {
            case 'Successful':
                return 0;
            case 'Failed':
                return 2;
            default:
                return 1;
            }
        };
    })
    .filter('alertColor', function () {
        return function (input) {
            input == input || 999;
            switch (input) {
            case 0:
                return 'success';
                break;
            case 1:
                return 'warning';
                break;
            case 2:
                return 'danger';
                break;
            default:
                return 'default';
            }
        };
    })
    .filter('formatDateTime', function () {
        return function (input) {
            var d = new Date(input);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        };
    })
    .filter('formatDateTimeSince', function () {
        return function (input) {
            var d = new Date(input);
            return timeSince(d);
        };
    })
    .filter('restrictLengthTo', function () {
        return function (input, maxLen) {
            if (input.length > maxLen) {
                return input.substring(0, maxLen) + '...'
            }
            return input;
        };
    })
    .filter('planTypeString', function () {
        return function (cluster) {
            if (!cluster) {
                return "";
            }

            if (cluster.replication_factor === 1) {
                return "Cache";
            } else {
                if (cluster.storage_type === 'ssd') {
                    return "Flash"
                }
                return "In-Memory"
            }
        };
    })