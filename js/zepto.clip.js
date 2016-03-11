/**
 * zepto.canvas-clip
 */

(function($) {
    $.fn.clip = function(options) {
        var defaults = {
            imgsrc: './images/ticket-bg-false.png',
            borderWidth: 10
        };
        var options = $.extend(defaults, options);
        var device = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()),
            clickEvtName = device ? 'touchstart' : 'mousedown',
            moveEvtName = device ? 'touchmove' : 'mousemove';
        this.each(function() {
            var $_this = $(this);
            var li_height = $(this).height() - 2 * options.borderWidth;
            var li_width = $(this).width() - 2 * options.borderWidth;
            var touchRadius = 10;    // 默认手指触摸半径，可以自定义设置
            var img = new Image();
            img.src = options.imgsrc;
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            var isMouseDown = false;
            var init = function() {
                createCanvas();
                ifMouseDown();
                move();
                //初始化
            }

            //插入遮盖的canvas
            var createCanvas = function(){
                canvas.id = 'clip-'+$_this.index();
                canvas.height = li_height;
                canvas.width = li_width;
                canvas.style.position = 'absolute';
                canvas.style.top = 0;
                canvas.style.left = 0;
                context.drawImage(img,0,0,canvas.width,canvas.height);
                $_this.prepend(canvas);
            }

            var fillCircle = function (x, y, radius, fillColor) {
                this.fillStyle = fillColor || "#eee";
                this.beginPath();
                this.moveTo(x, y);
                this.arc(x, y, radius, 0, Math.PI * 2, false);    // 标准画圆
                this.fill();
            };

            var ifMouseDown = function(){
                if (!device) {
                    document.addEventListener('mouseup', function (e) {
                        isMouseDown = false;
                    }, false);
                } else {
                    document.addEventListener("touchmove", function (e) {
                        if (isMouseDown) {
                            e.preventDefault();
                        }
                    }, false);
                    document.addEventListener('touchend', function (e) {
                        isMouseDown = false;
                    }, false);
                }
            }
            var getTransparentPercent = function (context, width, height) {
                var imgData = context.getImageData(0, 0, width, height),    // 得到canvas的像素信息
                    pixles = imgData.data,
                    transPixs = [];
                for (var i = 0, j = pixles.length; i < j; i += 4) {    // 因为存储的结构为[R, G, B, A]，所以要每次跳4个长度
                    var a = pixles[i + 3];    // 拿到存储alpha通道的值
                    if (a === 0) {    // alpha通道为0，就代表透明
                        transPixs.push(i);
                    }
                }
                return (transPixs.length / (pixles.length / 4) * 100).toFixed(2);
            }

            //将窗口的鼠标对于回canvas里的鼠标位置
            var windowToCanvas = function(canvas, x, y) {
                var bbox = canvas.getBoundingClientRect();
                return {
                    x: x - bbox.left * (canvas.width / bbox.width),
                    y: y - bbox.top * (canvas.height / bbox.height)
                };
            }

            var move = function(){
                // 开始移动
                canvas.addEventListener(clickEvtName, function (e) {
                    isMouseDown = true;
                    var x = (device ? e.touches[0].clientX : e.clientX);
                    var y = (device ? e.touches[0].clientY : e.clientY);
                    var points = windowToCanvas(canvas,x,y);
                    context.globalCompositeOperation = 'destination-out';    // 关键部分，描述当在canvas上再次绘画时候的情况，这个设置便是之前所说的透明
                    fillCircle.call(context, points.x, points.y, touchRadius);
                }, false);

                // 移动中
                canvas.addEventListener(moveEvtName, function (e) {
                    if (!device && !isMouseDown) {
                        return false;
                    }
                    var x = (device ? e.touches[0].clientX : e.clientX);
                    var y = (device ? e.touches[0].clientY : e.clientY);
                    var points = windowToCanvas(canvas,x,y);
                    context.globalCompositeOperation = 'destination-out';
                    fillCircle.call(context, points.x, points.y, touchRadius);
                    if(getTransparentPercent(context, li_width, li_height)>70){
                        $_this.attr('data-open','1');
                    };
                }, false);
            }

            img.onload = function(){
                init();
            }

            return this;
        })
    };
})(Zepto);